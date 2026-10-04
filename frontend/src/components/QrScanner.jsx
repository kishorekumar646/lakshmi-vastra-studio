import { useEffect, useRef, useState } from "react";
import { X, Camera, Upload, ScanLine } from "lucide-react";

const JQSR_CDN = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";

function loadJsQR() {
  return new Promise((resolve) => {
    if (window.jsQR) { resolve(window.jsQR); return; }
    const s = document.createElement("script");
    s.src = JQSR_CDN;
    s.onload = () => resolve(window.jsQR);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export default function QrScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const jsQRRef = useRef(null);

  const [permState, setPermState] = useState("idle"); // idle | asking | granted | denied
  const [error, setError] = useState("");
  const [decoding, setDecoding] = useState(false);

  useEffect(() => {
    loadJsQR().then((fn) => { jsQRRef.current = fn; });
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const startCamera = async () => {
    setError("");
    setPermState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setPermState("granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          scanLoop();
        };
      }
    } catch (err) {
      const perm = navigator.permissions
        ? await navigator.permissions.query({ name: "camera" }).catch(() => null)
        : null;
      if (err.name === "NotAllowedError" || perm?.state === "denied") {
        setPermState("denied");
      } else {
        setPermState("denied");
        setError(err.message || "Could not access camera.");
      }
    }
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      if (jsQRRef.current) {
        const code = jsQRRef.current(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          stopCamera();
          onScan(code.data);
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  };

  const decodeFromFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDecoding(true);
    setError("");
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
      // fallback: try BarcodeDetector if available
      if ("BarcodeDetector" in window) {
        const codes = await new window.BarcodeDetector({ formats: ["qr_code"] }).detect(canvas);
        if (codes.length > 0) { onScan(codes[0].rawValue); return; }
      }
      setError("No QR code found. Try a clearer, closer photo.");
    } catch {
      setError("Could not read the image. Try again.");
    } finally {
      setDecoding(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "1.5rem", width: "100%", maxWidth: 380 }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.1rem" }}>
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ScanLine size={20} /> Scan QR Code
          </h3>
          <button onClick={() => { stopCamera(); onClose(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#888" }}>
            <X size={20} />
          </button>
        </div>

        {/* ── Camera live view ── */}
        {permState === "granted" && (
          <>
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000", marginBottom: "0.75rem" }}>
              <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block", borderRadius: 10 }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <div style={{ width: 200, height: 200, border: "3px solid rgba(255,255,255,0.85)", borderRadius: 12, boxShadow: "0 0 0 4000px rgba(0,0,0,0.4)" }} />
              </div>
            </div>
            <p style={{ color: "#888", fontSize: "0.78rem", textAlign: "center", margin: "0 0 1rem" }}>Scanning automatically…</p>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%", padding: "0.65rem", background: "#F1F5F9", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", boxSizing: "border-box" }}>
              <Upload size={14} /> Upload QR Image Instead
              <input type="file" accept="image/*" capture="environment" onChange={decodeFromFile} style={{ display: "none" }} />
            </label>
          </>
        )}

        {/* ── Asking / loading ── */}
        {permState === "asking" && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>⏳</div>
            <p style={{ fontWeight: 700, color: "#111" }}>Requesting camera…</p>
          </div>
        )}

        {/* ── Idle: show allow button ── */}
        {permState === "idle" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Camera size={28} color="var(--primary)" />
            </div>
            <p style={{ fontWeight: 700, color: "#111", margin: "0 0 0.4rem" }}>Camera Access Needed</p>
            <p style={{ fontSize: "0.83rem", color: "#555", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
              Allow camera to scan the QR code directly.
            </p>
            <button onClick={startCamera} style={{ width: "100%", padding: "0.8rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", boxSizing: "border-box", marginBottom: "0.75rem" }}>
              <Camera size={18} /> Allow Camera & Scan
            </button>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%", padding: "0.75rem", boxSizing: "border-box", background: "#F1F5F9", color: "#333", border: "1.5px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem" }}>
              <Upload size={16} /> Take Photo to Scan Instead
              <input type="file" accept="image/*" capture="environment" onChange={decodeFromFile} style={{ display: "none" }} />
            </label>
          </div>
        )}

        {/* ── Denied: file upload as primary action ── */}
        {permState === "denied" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📷</div>
            <p style={{ fontWeight: 700, color: "#111", margin: "0 0 0.4rem" }}>Camera Blocked — Use Photo Instead</p>
            <p style={{ fontSize: "0.83rem", color: "#555", lineHeight: 1.6, margin: "0 0 1.1rem" }}>
              Open your <strong>camera app</strong>, take a photo of the QR code, then tap the button below to upload it.
            </p>

            {error && <p style={{ fontSize: "0.8rem", color: "#c00", margin: "0 0 0.75rem" }}>{error}</p>}

            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%", padding: "0.85rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", boxSizing: "border-box", marginBottom: "0.75rem" }}>
              {decoding ? "Decoding…" : <><Camera size={18} /> Take Photo of QR Code</>}
              <input type="file" accept="image/*" capture="environment" onChange={decodeFromFile} style={{ display: "none" }} disabled={decoding} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%", padding: "0.75rem", boxSizing: "border-box", background: "#F1F5F9", color: "#475569", border: "1.5px solid #E2E8F0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", marginBottom: "1rem" }}>
              <Upload size={15} /> Upload from Gallery
              <input type="file" accept="image/*" onChange={decodeFromFile} style={{ display: "none" }} disabled={decoding} />
            </label>

            <div style={{ background: "#FEF3C7", border: "1.5px solid #FCD34D", borderRadius: 10, padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.78rem", color: "#92400E", lineHeight: 1.7 }}>
              <strong>To enable live scanning:</strong><br />
              <strong>Chrome:</strong> Tap 🔒 in address bar → Permissions → Camera → Allow<br />
              <strong>iPhone Safari:</strong> Settings → Safari → Camera → Allow
            </div>
          </div>
        )}

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
