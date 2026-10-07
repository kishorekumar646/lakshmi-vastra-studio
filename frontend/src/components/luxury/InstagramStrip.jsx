import { useEffect, useRef } from "react";
import { INSTAGRAM_IMAGES } from "../../data/products";

export default function InstagramStrip() {
  const track1Ref = useRef(null);
  const speedRef = useRef(1);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    let lastY = window.scrollY;
    let raf;

    const onScroll = () => {
      const delta = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      speedRef.current = Math.min(4.5, 1 + delta * 0.06);
    };

    const animate = () => {
      speedRef.current = Math.max(1, speedRef.current * 0.96);
      const duration = `${32 / speedRef.current}s`;
      if (track1Ref.current) {
        track1Ref.current.style.animationDuration = duration;
      }
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Duplicate images for seamless loop
  const imgs = [...INSTAGRAM_IMAGES, ...INSTAGRAM_IMAGES];

  return (
    <section
      style={{
        background: "#fff",
        padding: "4.5rem 0",
        overflow: "hidden",
        position: "relative",
      }}
      aria-label="Instagram Feed"
    >
      <style>{`
        @keyframes marqueeRoll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          display: flex;
          gap: 1rem;
          width: max-content;
          animation: marqueeRoll 32s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>

      {/* Center handle pill */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "2.25rem",
        }}
      >
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block",
            background: "#1A0E14",
            color: "#fff",
            padding: "0.65rem 1.9rem",
            borderRadius: 9999,
            fontSize: "0.8rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "#1A0E14")
          }
        >
          @lvstudio.official &mdash; Follow Us on Instagram
        </a>
      </div>

      {/* Marquee */}
      <div style={{ display: "flex", overflow: "hidden" }}>
        <div ref={track1Ref} className="marquee-track">
          {imgs.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Instagram post"
              loading="lazy"
              style={{
                width: 200,
                height: 200,
                objectFit: "cover",
                borderRadius: 10,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
