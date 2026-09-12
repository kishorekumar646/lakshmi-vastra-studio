import { useState, useRef } from "react";

const ZOOM = 3;      // magnification factor
const LENS = 155;    // lens diameter in px

export default function MagnifierImage({ src, alt, onClick }) {
  const [pos, setPos] = useState(null);
  const imgRef = useRef();

  const onMove = (e) => {
    const img = imgRef.current;
    if (!img) return;
    const { left, top, width, height } = img.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    if (x < 0 || y < 0 || x > width || y > height) { setPos(null); return; }
    setPos({ x, y, W: width, H: height });
  };

  // Clamp lens so it never goes outside the image area
  const lensLeft = pos ? Math.max(LENS / 2, Math.min(pos.x, pos.W - LENS / 2)) - LENS / 2 : 0;
  const lensTop  = pos ? Math.max(LENS / 2, Math.min(pos.y, pos.H - LENS / 2)) - LENS / 2 : 0;

  return (
    <div
      style={{ position: "relative", overflow: "hidden", borderRadius: 6, lineHeight: 0 }}
      onMouseMove={onMove}
      onMouseLeave={() => setPos(null)}
    >
      {/* Main image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onClick={onClick}
        style={{
          width: "100%",
          display: "block",
          objectFit: "cover",
          maxHeight: 520,
          cursor: "crosshair",
        }}
      />

      {/* Magnifier lens — only on hover (desktop only, no touch events) */}
      {pos && (
        <div
          style={{
            position: "absolute",
            left: lensLeft,
            top: lensTop,
            width: LENS,
            height: LENS,
            borderRadius: "50%",
            overflow: "hidden",
            border: "2.5px solid rgba(255,255,255,0.88)",
            boxShadow: "0 6px 28px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(184,137,42,0.35)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {/* Zoomed image — positioned so cursor point is centred in lens */}
          <img
            src={src}
            alt=""
            style={{
              position: "absolute",
              width: pos.W * ZOOM,
              height: pos.H * ZOOM,
              left: -(pos.x * ZOOM - LENS / 2),
              top:  -(pos.y * ZOOM - LENS / 2),
              objectFit: "cover",
              display: "block",
              userSelect: "none",
              WebkitUserSelect: "none",
            }}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
}
