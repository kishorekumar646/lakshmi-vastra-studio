import { useEffect, useRef, useState } from "react";
import { X, Camera, Upload, ScanLine, RefreshCw } from "lucide-react";

const JSQR_CDN = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";

const BARCODE_FORMATS = [
  "qr_code", "code_128", "code_39", "code_93", "ean_13", "ean_8",
  "upc_a", "upc_e", "data_matrix", "pdf417", "aztec", "codabar", "itf",
];

// Constraint chain: try best → simpler → bare. Handles picky Android cameras.
const CAM_CONSTRAINTS = [
  { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
  { video: { facingMode: "environment" } },
  { video: true },
];

function loadJsQR() {
  return new Promise((resolve) => {
    if (window.jsQR) { resolve(window.jsQR); return; }
    const s = document.createElement("script");
    s.src = JSQR_CDN;
    s.onload = () => resolve(window.jsQR || null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

async function getCameraPermState() {
  if (!navigator.permissions) return "unknown";
  try {
    const p = await navigator.permissions.query({ name: "camera" });
    return p.state; // "granted" | "prompt" | "denied"
  } catch {
    return "unknown"; // iOS Safari throws here — treat as retryable
  }
}

function makeBarcodeDetector() {
  if (!("BarcodeDetector" in window)) return null;
  try {
    return new window.BarcodeDetector({ formats: BARCODE_FORMATS });
  } catch {
    try { return new window.BarcodeDetector(); } catch { return null; }
  }
}

const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

/* ── Corner bracket overlay ── */
function Corners({ arm = 24, thickness = 3, color = "#fff", radius = 6 }) {
  const defs = [
    { top: 0, left: 0, borderTopWidth: thickness, borderLeftWidth: thickness, borderRadius: `${radius}px 0 0 0` },
    { top: 0, right: 0, borderTopWidth: thickness, borderRightWidth: thickness, borderRadius: `0 ${radius}px 0 0` },
    { bottom: 0, left: 0, borderBottomWidth: thickness, borderLeftWidth: thickness, borderRadius: `0 0 0 ${radius}px` },
    { bottom: 0, right: 0, borderBottomWidth: thickness, borderRightWidth: thickness, borderRadius: `0 0 ${radius}px 0` },
  ];
  return (
    <>
      {defs.map((d, i) => (
        <div key={i} style={{ position: "absolute", width: arm, height: arm, borderStyle: "solid", borderColor: color, borderWidth: 0, ...d }} />
      ))}
    </>
  );
}

/* ── Main ── */
export default function QrScanner({ onScan, onClose }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const jsQRRef     = useRef(null);
  const detectorRef = useRef(null);
  const scanningRef = useRef(false);
  const mountedRef  = useRef(true);

  // states: starting | live | denied | blocked | unsupported
  const [camState, setCamState]   = useState("starting");
  const [fileError, setFileError] = useState("");
  const [decoding, setDecoding]   = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    loadJsQR().then((fn) => { jsQRRef.current = fn; });
    detectorRef.current = makeBarcodeDetector();
    startCamera();
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    if (!mountedRef.current) return;
    setCamState("starting");
    setFileError("");
    scanningRef.current = false;

    // Guard: camera API not available (non-HTTPS, very old browser)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamState("unsupported");
      return;
    }

    // Try each constraint set in order
    let stream = null;
    let lastErr = null;
    for (const constraints of CAM_CONSTRAINTS) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (err) {
        lastErr = err;
        // Permission denied — stop immediately, don't try more constraints
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") break;
      }
    }

    if (!mountedRef.current) { stream?.getTracks().forEach((t) => t.stop()); return; }

    if (!stream) {
      const permState = await getCameraPermState();
      setCamState(
        (lastErr?.name === "NotAllowedError" || lastErr?.name === "PermissionDeniedError")
          ? (permState === "denied" ? "blocked" : "denied")
          : "denied"
      );
      return;
    }

    streamRef.current = stream;
    setCamState("live");

    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;

    // Play safely — iOS needs playsInline (set in JSX) and the play() promise handled
    const tryPlay = () =>
      video.play().then(() => {
        if (mountedRef.current) scanLoop();
      }).catch(() => {
        // iOS PWA occasionally needs a short delay before play() succeeds
        setTimeout(() => {
          if (mountedRef.current) video.play().then(() => scanLoop()).catch(() => {});
        }, 150);
      });

    if (video.readyState >= 2) {
      tryPlay();
    } else {
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
    }
  };

  const scanLoop = () => {
    if (!mountedRef.current) return;
    rafRef.current = requestAnimationFrame(scanLoop);
    if (scanningRef.current) return;

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) return;

    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    scanningRef.current = true;
    Promise.resolve()
      .then(async () => {
        if (!mountedRef.current) return;
        // Primary: BarcodeDetector (Chrome Android — QR + all 1D barcodes)
        if (detectorRef.current) {
          try {
            const codes = await detectorRef.current.detect(canvas);
            if (codes.length > 0 && mountedRef.current) { stopCamera(); onScan(codes[0].rawValue); return; }
          } catch { /* fall through */ }
        }
        // Fallback: jsQR (QR only, works on Safari / Firefox)
        if (jsQRRef.current && mountedRef.current) {
          const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQRRef.current(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (code?.data) { stopCamera(); onScan(code.data); }
        }
      })
      .finally(() => { scanningRef.current = false; });
  };

  const decodeFromFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");
    setDecoding(true);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = canvasRef.current;
      canvas.width  = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);

      if (detectorRef.current) {
        try {
          const codes = await detectorRef.current.detect(canvas);
          if (codes.length > 0) { onScan(codes[0].rawValue); return; }
        } catch { /* fall through */ }
      }
      if (jsQRRef.current) {
        const img  = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        const code = jsQRRef.current(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
        if (code?.data) { onScan(code.data); return; }
      }
      setFileError("No barcode or QR code found — try a clearer, well-lit photo.");
    } catch {
      setFileError("Could not read image. Try again.");
    } finally {
      setDecoding(false);
      e.target.value = "";
    }
  };

  const hasBarcodeSupport = !!detectorRef.current;

  /* ── Upload button — on mobile uses camera; on desktop opens file picker ── */
  const UploadBtn = ({ label = "Upload Image", primary = false }) => (
    <label style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
      width: "100%", padding: "0.78rem", boxSizing: "border-box",
      background: primary ? "var(--primary, #7B1D45)" : "rgba(255,255,255,0.08)",
      color: primary ? "#fff" : "#CBD5E1",
      border: primary ? "none" : "1px solid rgba(255,255,255,0.15)",
      borderRadius: 10, cursor: decoding ? "not-allowed" : "pointer",
      fontWeight: 700, fontSize: "0.88rem", opacity: decoding ? 0.7 : 1,
    }}>
      {decoding ? "Decoding…" : <><Upload size={15} /> {label}</>}
      <input type="file" accept="image/*"
        {...(isMobile ? { capture: "environment" } : {})}
        onChange={decodeFromFile} style={{ display: "none" }} disabled={decoding} />
    </label>
  );

  /* ── Outer shell: full-screen on mobile, centered card on desktop ── */
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: isMobile ? "#000" : "rgba(0,0,0,0.88)",
      display: "flex", alignItems: isMobile ? "stretch" : "center",
      justifyContent: isMobile ? "stretch" : "center",
      padding: isMobile ? 0 : "1rem",
    }}>
      <div style={{
        background: "#111",
        borderRadius: isMobile ? 0 : 16,
        width: "100%",
        maxWidth: isMobile ? "none" : 400,
        display: "flex", flexDirection: "column",
        paddingTop: isMobile ? "env(safe-area-inset-top, 0px)" : 0,
        paddingBottom: isMobile ? "env(safe-area-inset-bottom, 0px)" : 0,
        overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "0.9rem 1.1rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ScanLine size={20} color="#34D399" />
            <span style={{ fontWeight: 700, fontSize: "1rem", color: "#fff" }}>
              {hasBarcodeSupport ? "Scan QR / Barcode" : "Scan QR Code"}
            </span>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", padding: "0.45rem", borderRadius: 8, color: "#94A3B8", display: "flex", lineHeight: 0 }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Format badges ── */}
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", padding: "0.6rem 1.1rem 0" }}>
          {(hasBarcodeSupport
            ? ["QR Code", "Code 128", "EAN-13", "EAN-8", "UPC", "PDF417", "Data Matrix"]
            : ["QR Code"]
          ).map((f) => (
            <span key={f} style={{ fontSize: "0.58rem", fontWeight: 700, padding: "0.18rem 0.5rem", borderRadius: 20, background: "rgba(255,255,255,0.08)", color: "#64748B", letterSpacing: "0.04em" }}>
              {f}
            </span>
          ))}
        </div>

        {/* ── Camera / state area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0.75rem 1.1rem 1rem" }}>

          {/* Starting */}
          {camState === "starting" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.75rem", minHeight: 200 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Camera size={26} color="#34D399" />
              </div>
              <p style={{ fontWeight: 700, color: "#fff", margin: 0 }}>Opening camera…</p>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: 0 }}>Allow camera access when prompted</p>
            </div>
          )}

          {/* Live */}
          {camState === "live" && (
            <>
              {/* Camera viewport — fills remaining height on mobile */}
              <div style={{
                position: "relative",
                borderRadius: 12,
                overflow: "hidden",
                background: "#000",
                flex: isMobile ? 1 : "none",
                aspectRatio: isMobile ? "auto" : "1",
                minHeight: isMobile ? 0 : 300,
              }}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />

                {/* Dimmed overlay + viewfinder */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* Size viewfinder relative to container — 72% of width or max 240px */}
                  <div style={{
                    position: "relative",
                    width: "min(72%, 240px)",
                    aspectRatio: "1",
                    boxShadow: "0 0 0 2000px rgba(0,0,0,0.52)",
                    borderRadius: 4,
                  }}>
                    <Corners />
                    {/* Animated laser */}
                    <div style={{
                      position: "absolute", left: 4, right: 4, height: 2,
                      background: "linear-gradient(90deg, transparent, #34D399, #34D399, transparent)",
                      borderRadius: 999,
                      boxShadow: "0 0 8px rgba(52,211,153,0.9)",
                      animation: "scanLine 2s ease-in-out infinite",
                    }} />
                  </div>
                </div>
              </div>

              <p style={{ color: "#475569", fontSize: "0.75rem", textAlign: "center", margin: "0.65rem 0 0.65rem" }}>
                Point camera at a QR code or barcode — scans automatically
              </p>
              <UploadBtn label="Upload Image Instead" />
            </>
          )}

          {/* Denied once — can retry */}
          {camState === "denied" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, textAlign: "center", minHeight: 200 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📷</div>
              <p style={{ fontWeight: 700, color: "#fff", margin: "0 0 0.4rem" }}>Camera Access Needed</p>
              <p style={{ fontSize: "0.83rem", color: "#64748B", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
                Tap <strong style={{ color: "#fff" }}>Allow</strong> when the browser asks for camera permission.
              </p>
              <button onClick={startCamera} style={{
                width: "100%", padding: "0.85rem", background: "var(--primary, #7B1D45)", color: "#fff",
                border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                boxSizing: "border-box", marginBottom: "0.75rem",
              }}>
                <Camera size={18} /> Allow Camera & Scan
              </button>
              <UploadBtn label="Upload QR / Barcode Image" />
              {fileError && <p style={{ fontSize: "0.8rem", color: "#f87171", marginTop: "0.5rem" }}>{fileError}</p>}
            </div>
          )}

          {/* Permanently blocked */}
          {camState === "blocked" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 200 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔒</div>
              <p style={{ fontWeight: 700, color: "#fff", margin: "0 0 0.4rem" }}>Camera Blocked</p>
              <p style={{ fontSize: "0.83rem", color: "#64748B", margin: "0 0 0.9rem", lineHeight: 1.6 }}>
                Camera is blocked in browser settings. Upload a photo or unblock it first.
              </p>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.78rem", color: "#64748B", lineHeight: 1.8, marginBottom: "1rem", width: "100%", boxSizing: "border-box" }}>
                <strong style={{ color: "#cbd5e1" }}>Android Chrome:</strong> Tap 🔒 in address bar → Camera → Allow<br />
                <strong style={{ color: "#cbd5e1" }}>iPhone Safari:</strong> Settings → Safari → Camera → Allow
              </div>
              <button onClick={startCamera} style={{
                width: "100%", padding: "0.7rem", background: "rgba(255,255,255,0.08)", color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                boxSizing: "border-box", marginBottom: "0.75rem",
              }}>
                <RefreshCw size={15} /> Try Again
              </button>
              <UploadBtn label="Upload QR / Barcode Image" primary />
              {fileError && <p style={{ fontSize: "0.8rem", color: "#f87171", marginTop: "0.75rem" }}>{fileError}</p>}
            </div>
          )}

          {/* No camera API — non-HTTPS or very old browser */}
          {camState === "unsupported" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "0.5rem", minHeight: 200 }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
              <p style={{ fontWeight: 700, color: "#fff", margin: 0 }}>Camera Not Available</p>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0 0 1rem", lineHeight: 1.6 }}>
                Camera access requires HTTPS. Upload a QR image instead.
              </p>
              <UploadBtn label="Upload QR / Barcode Image" primary />
              {fileError && <p style={{ fontSize: "0.8rem", color: "#f87171", marginTop: "0.5rem" }}>{fileError}</p>}
            </div>
          )}

        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 6px;  opacity: 1; }
          46%  { top: calc(100% - 8px); opacity: 1; }
          50%  { top: calc(100% - 8px); opacity: 0; }
          54%  { top: 6px;  opacity: 0; }
          58%  { top: 6px;  opacity: 1; }
          100% { top: 6px;  opacity: 1; }
        }
      `}</style>
    </div>
  );
}
