import { useEffect, useRef, useState } from "react";
import { X, Camera, Upload, ScanLine, RefreshCw, Settings } from "lucide-react";

const JSQR_CDN = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";

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

// "denied" = browser permanently blocked; "dismissed" = user tapped deny once (can retry)
async function getCameraPermState() {
  if (!navigator.permissions) return "unknown";
  try {
    const p = await navigator.permissions.query({ name: "camera" });
    return p.state; // "granted" | "prompt" | "denied"
  } catch {
    return "unknown";
  }
}

export default function QrScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const jsQRRef = useRef(null);

  // states: starting | live | denied | blocked | unsupported
  const [state, setState] = useState("starting");
  const [fileError, setFileError] = useState("");
  const [decoding, setDecoding] = useState(false);

  useEffect(() => {
    loadJsQR().then((fn) => { jsQRRef.current = fn; });
    startCamera();
    return stopCamera;
  }, []);

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setState("starting");
    setFileError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setState("live");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          scanLoop();
        };
      }
    } catch (err) {
      stopCamera();
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        const permState = await getCameraPermState();
        // "denied" = permanently blocked in browser settings; "prompt" = dismissed once (can retry)
        setState(permState === "denied" ? "blocked" : "denied");
      } else {
        setState("denied"); // any other error — let them retry
      }
    }
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    if (jsQRRef.current) {
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQRRef.current(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
      if (code?.data) {
        stopCamera();
        onScan(code.data);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  };

  const decodeFromFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileError("");
    setDecoding(true);
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = canvasRef.current;
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0);
      const img = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

      if (jsQRRef.current) {
        const code = jsQRRef.current(img.data, img.width, img.height, { inversionAttempts: "attemptBoth" });
        if (code?.data) { onScan(code.data); return; }
      }
      // secondary fallback: BarcodeDetector (Chrome)
      if ("BarcodeDetector" in window) {
        const codes = await new window.BarcodeDetector({ formats: ["qr_code"] }).detect(canvas);
        if (codes.length > 0) { onScan(codes[0].rawValue); return; }
      }
      setFileError("No QR code found — try a clearer, well-lit photo.");
    } catch {
      setFileError("Could not read image. Try again.");
    } finally {
      setDecoding(false);
    }
  };

  /* ── shared upload button ── */
  const UploadBtn = ({ label = "Upload QR Image", secondary = true }) => (
    <label style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
      width: "100%", padding: secondary ? "0.7rem" : "0.85rem", boxSizing: "border-box",
      background: secondary ? "#F1F5F9" : "var(--primary)",
      color: secondary ? "#475569" : "#fff",
      border: secondary ? "1.5px solid #E2E8F0" : "none",
      borderRadius: 9, cursor: decoding ? "not-allowed" : "pointer",
      fontWeight: 700, fontSize: "0.88rem", opacity: decoding ? 0.7 : 1,
    }}>
      {decoding ? "Decoding…" : <><Upload size={15} /> {label}</>}
      <input type="file" accept="image/*" capture="environment" onChange={decodeFromFile}
        style={{ display: "none" }} disabled={decoding} />
    </label>
  );

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 380 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ScanLine size={20} /> Scan QR Code
          </h3>
          <button onClick={() => { stopCamera(); onClose(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#888" }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Starting / requesting camera ── */}
        {state === "starting" && (
          <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
            <Camera size={40} color="var(--primary)" style={{ marginBottom: "1rem" }} />
            <p style={{ fontWeight: 700, color: "#111", margin: "0 0 0.3rem" }}>Opening camera…</p>
            <p style={{ fontSize: "0.82rem", color: "#888", margin: 0 }}>Allow camera access when prompted</p>
          </div>
        )}

        {/* ── Live camera feed ── */}
        {state === "live" && (
          <>
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000", marginBottom: "0.75rem" }}>
              <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block" }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ width: 200, height: 200, border: "3px solid rgba(255,255,255,0.85)", borderRadius: 12, boxShadow: "0 0 0 4000px rgba(0,0,0,0.45)" }} />
              </div>
            </div>
            <p style={{ color: "#888", fontSize: "0.78rem", textAlign: "center", margin: "0 0 0.85rem" }}>
              Point camera at the QR code — scanning automatically
            </p>
            <UploadBtn label="Upload QR Image Instead" />
          </>
        )}

        {/* ── Denied once — can retry ── */}
        {state === "denied" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📷</div>
            <p style={{ fontWeight: 700, color: "#111", margin: "0 0 0.4rem" }}>Camera Access Needed</p>
            <p style={{ fontSize: "0.83rem", color: "#555", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
              Tap <strong>Allow</strong> when the browser asks for camera permission.
            </p>
            <button onClick={startCamera} style={{
              width: "100%", padding: "0.85rem", background: "var(--primary)", color: "#fff",
              border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxSizing: "border-box", marginBottom: "0.75rem",
            }}>
              <Camera size={18} /> Allow Camera & Scan
            </button>
            <div style={{ marginBottom: "0.75rem" }}><UploadBtn label="Take Photo to Scan Instead" secondary={true} /></div>
            {fileError && <p style={{ fontSize: "0.8rem", color: "#c00", margin: "0.5rem 0 0" }}>{fileError}</p>}
          </div>
        )}

        {/* ── Permanently blocked ── */}
        {state === "blocked" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔒</div>
            <p style={{ fontWeight: 700, color: "#111", margin: "0 0 0.4rem" }}>Camera Blocked</p>
            <p style={{ fontSize: "0.83rem", color: "#555", margin: "0 0 0.9rem", lineHeight: 1.6 }}>
              Camera is blocked in browser settings. Use the photo option below, or unblock it first.
            </p>
            <div style={{ background: "#FEF3C7", border: "1.5px solid #FCD34D", borderRadius: 10, padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.78rem", color: "#92400E", lineHeight: 1.7, marginBottom: "1rem" }}>
              <strong>Android Chrome:</strong> Tap 🔒 in address bar → Camera → Allow<br />
              <strong>iPhone Safari:</strong> Settings → Safari → Camera → Allow
            </div>
            <button onClick={startCamera} style={{
              width: "100%", padding: "0.7rem", background: "#F1F5F9", color: "#334155",
              border: "1.5px solid #E2E8F0", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              boxSizing: "border-box", marginBottom: "0.75rem",
            }}>
              <RefreshCw size={15} /> Try Again
            </button>
            <UploadBtn label="Take Photo of QR Code" secondary={false} />
            {fileError && <p style={{ fontSize: "0.8rem", color: "#c00", margin: "0.75rem 0 0" }}>{fileError}</p>}
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
