import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export default function Lightbox({ images, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const touchStartX = useRef(null);

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : images.length - 1));
  const next = () => setCurrent((c) => (c < images.length - 1 ? c + 1 : 0));

  // Keyboard navigation + lock background scroll
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  setCurrent((c) => (c > 0 ? c - 1 : images.length - 1));
      if (e.key === "ArrowRight") setCurrent((c) => (c < images.length - 1 ? c + 1 : 0));
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, images.length]);

  // Swipe detection
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (delta > 50)  next();
    if (delta < -50) prev();
    touchStartX.current = null;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.94)",
        zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 0.18s ease",
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.12)",
          border: "none", borderRadius: "50%",
          width: 44, height: 44,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", cursor: "pointer",
          transition: "background 0.2s",
          zIndex: 1,
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
        onMouseOut={(e)  => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
      >
        <X size={22} />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div style={{
          position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.65)", fontSize: "0.85rem", letterSpacing: "0.08em",
          fontWeight: 500,
        }}>
          {current + 1} / {images.length}
        </div>
      )}

      {/* Left arrow */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          style={{
            position: "absolute", left: 12,
            background: "rgba(255,255,255,0.10)",
            border: "none", borderRadius: "50%",
            width: 48, height: 48,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer", transition: "background 0.2s",
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
          onMouseOut={(e)  => e.currentTarget.style.background = "rgba(255,255,255,0.10)"}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Image */}
      <img
        key={current}
        src={images[current]}
        alt=""
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          maxWidth: "92vw", maxHeight: "88vh",
          objectFit: "contain",
          borderRadius: 4,
          boxShadow: "0 8px 48px rgba(0,0,0,0.6)",
          animation: "fadeIn 0.2s ease",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        draggable={false}
      />

      {/* Right arrow */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          style={{
            position: "absolute", right: 12,
            background: "rgba(255,255,255,0.10)",
            border: "none", borderRadius: "50%",
            width: 48, height: 48,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer", transition: "background 0.2s",
          }}
          onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
          onMouseOut={(e)  => e.currentTarget.style.background = "rgba(255,255,255,0.10)"}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div style={{
          position: "absolute", bottom: 24,
          display: "flex", gap: "0.5rem",
          left: "50%", transform: "translateX(-50%)",
        }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              style={{
                width: i === current ? 22 : 8,
                height: 8, borderRadius: 4,
                background: i === current ? "#fff" : "rgba(255,255,255,0.35)",
                border: "none", cursor: "pointer", padding: 0,
                transition: "width 0.25s, background 0.25s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
