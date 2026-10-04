import { useEffect, useRef, useState } from "react";
import { X, Camera, Upload } from "lucide-react";

// Uses browser-native BarcodeDetector (Chrome, Edge, Android Chrome).
// Falls back to file-upload for iOS Safari.

export default function QrScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(null); // null=checking, true, false

  useEffect(() => {
    if ("BarcodeDetector" in window) {
      setSupported(true);
      startCamera();
    } else {
      setSupported(false);
    }
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          beginDetection();
        };
      }
    } catch {
      setError("Camera access denied. Please allow camera permission and try again.");
    }
  };

  const stopCamera = () => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const beginDetection = () => {
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    timerRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      try {
        const codes = await detector.detect(canvas);
        if (codes.length > 0) {
          stopCamera();
          onScan(codes[0].rawValue);
        }
      } catch {}
    }, 400);
  };

  // iOS / Firefox fallback: let user capture photo, decode via BarcodeDetector on image
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      if ("BarcodeDetector" in window) {
        try {
          const codes = await new window.BarcodeDetector({ formats: ["qr_code"] }).detect(canvas);
          if (codes.length > 0) { onScan(codes[0].rawValue); return; }
        } catch {}
      }
      setError("No QR code found in image. Try again with a clearer photo.");
    };
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{ background: "#fff", borderRadius: 12, padding: "1.5rem", width: "100%", maxWidth: 380 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "var(--primary)" }}>
            Scan QR Code
          </h3>
          <button onClick={() => { stopCamera(); onClose(); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {supported === false ? (
          // iOS Safari / Firefox: file upload fallback
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1rem" }}>
              Live scanning is not supported on this browser. Take a photo of the QR code instead.
            </p>
            <label style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "var(--primary)", color: "#fff", padding: "0.7rem 1.25rem",
              borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.9rem",
            }}>
              <Upload size={16} /> Take Photo / Upload
              <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        ) : (
          <>
            <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.75rem" }}>
              Point camera at the QR code on the order
            </p>
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000" }}>
              <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block", borderRadius: 10 }} />
              {/* Scanner overlay */}
              <div style={{
                position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "none",
              }}>
                <div style={{
                  width: 200, height: 200, border: "3px solid rgba(255,255,255,0.8)", borderRadius: 12,
                  boxShadow: "0 0 0 4000px rgba(0,0,0,0.4)",
                }} />
              </div>
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {error && <p style={{ color: "#c00", fontSize: "0.82rem", marginTop: "0.75rem", textAlign: "center" }}>{error}</p>}
            {!error && <p style={{ color: "#888", fontSize: "0.78rem", marginTop: "0.75rem", textAlign: "center" }}>Scanning automatically...</p>}
          </>
        )}
      </div>
    </div>
  );
}
