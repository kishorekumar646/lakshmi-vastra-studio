import { useEffect, useRef, useState } from "react";
import { X, Camera, Upload, Settings } from "lucide-react";

export default function QrScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const [error, setError] = useState("");
  const [permState, setPermState] = useState("idle"); // idle | asking | granted | prompt | denied
  const [supported, setSupported] = useState(null);

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
    setError("");
    setPermState("asking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setPermState("granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          beginDetection();
        };
      }
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        // Check if it's permanently denied or just dismissed
        const perm = navigator.permissions
          ? await navigator.permissions.query({ name: "camera" }).catch(() => null)
          : null;
        if (perm?.state === "denied") {
          setPermState("denied");
          setError("Camera is blocked in your browser settings.");
        } else {
          setPermState("prompt");
          setError("Camera access was not allowed. Tap the button below to try again.");
        }
      } else {
        setPermState("prompt");
        setError("Could not access camera.");
      }
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
        if (codes.length > 0) { stopCamera(); onScan(codes[0].rawValue); }
      } catch {}
    }, 400);
  };

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

        {/* Header */}
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
          /* iOS / Firefox — file upload only */
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

        ) : permState === "denied" ? (
          /* Permanently blocked — guide user to settings */
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🔒</div>
            <p style={{ fontWeight: 700, color: "#111", marginBottom: "0.4rem" }}>Camera Blocked</p>
            <p style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              Camera access is blocked in your browser settings. To enable it:
            </p>
            <div style={{
              background: "#f8f8f8", borderRadius: 10, padding: "0.9rem 1rem",
              textAlign: "left", fontSize: "0.83rem", color: "#333",
              lineHeight: 1.7, marginBottom: "1.25rem",
            }}>
              <strong>Android Chrome:</strong> Tap the 🔒 lock icon in the address bar → Permissions → Camera → Allow<br />
              <strong>iPhone Safari:</strong> Settings → Safari → Camera → Allow
            </div>
            {/* File upload fallback */}
            <label style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "#1a4080", color: "#fff", padding: "0.7rem 1.25rem",
              borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.88rem",
              marginBottom: "0.75rem", width: "100%", justifyContent: "center", boxSizing: "border-box",
            }}>
              <Upload size={16} /> Upload QR Code Image Instead
              <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

        ) : permState === "idle" || permState === "asking" || permState === "prompt" ? (
          /* Not yet granted — show Allow button */
          <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
              {permState === "asking" ? "⏳" : <Camera size={48} color="var(--primary)" />}
            </div>
            <p style={{ fontWeight: 700, color: "#111", marginBottom: "0.4rem" }}>
              {permState === "asking" ? "Requesting camera…" : "Camera Access Needed"}
            </p>
            {error && (
              <p style={{ fontSize: "0.83rem", color: "#c00", margin: "0.5rem 0 1rem", lineHeight: 1.5 }}>
                {error}
              </p>
            )}
            {!error && (
              <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1.25rem" }}>
                Allow camera access to scan QR codes directly.
              </p>
            )}
            {permState !== "asking" && (
              <>
                <button
                  onClick={startCamera}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    width: "100%", padding: "0.8rem", marginBottom: "0.75rem",
                    background: "var(--primary)", color: "#fff",
                    border: "none", borderRadius: 8, cursor: "pointer",
                    fontWeight: 700, fontSize: "0.95rem", boxSizing: "border-box",
                  }}
                >
                  <Camera size={18} /> Allow Camera Access
                </button>
                <label style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  width: "100%", padding: "0.75rem", boxSizing: "border-box",
                  background: "#f1f5f9", color: "#333",
                  border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer",
                  fontWeight: 600, fontSize: "0.88rem",
                }}>
                  <Upload size={16} /> Upload QR Image Instead
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: "none" }} />
                </label>
              </>
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>

        ) : (
          /* Camera active — scanning */
          <>
            <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.75rem" }}>
              Point camera at the QR code on the order
            </p>
            <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#000" }}>
              <video ref={videoRef} playsInline muted style={{ width: "100%", display: "block", borderRadius: 10 }} />
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
            <p style={{ color: "#888", fontSize: "0.78rem", marginTop: "0.75rem", textAlign: "center" }}>
              Scanning automatically…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
