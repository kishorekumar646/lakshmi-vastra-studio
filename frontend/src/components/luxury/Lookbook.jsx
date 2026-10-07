import { useEffect, useRef, useState } from "react";
import { LOOKBOOK_IMAGES } from "../../data/products";

export default function Lookbook() {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const progressRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (prefersReduced || isMobile) return;

    const handleScroll = () => {
      const wrapper = wrapperRef.current;
      const track = trackRef.current;
      if (!wrapper || !track) return;

      const rect = wrapper.getBoundingClientRect();
      const scrolledInto = -rect.top;
      const scrollable = wrapper.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const progress = Math.max(0, Math.min(1, scrolledInto / scrollable));
      const totalX = track.scrollWidth - window.innerWidth;
      track.style.transform = `translateX(-${progress * totalX}px)`;

      if (progressRef.current) {
        progressRef.current.style.width = `${progress * 100}%`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prefersReduced, isMobile]);

  if (prefersReduced || isMobile) {
    return (
      <section
        style={{
          background: "#0D0611",
          padding: "5rem 0 3rem",
        }}
        aria-label="Lookbook"
      >
        <div
          className="container"
          style={{ marginBottom: "2.5rem" }}
        >
          <p
            style={{
              fontSize: "0.68rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--gold)",
              fontWeight: 700,
              marginBottom: "0.6rem",
            }}
          >
            Editorial
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.9rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Lookbook
          </h2>
        </div>

        {/* Native horizontal scroll on mobile/reduced-motion */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            overflowX: "auto",
            paddingLeft: "max(1.25rem, calc((100vw - 1200px) / 2))",
            paddingRight: "1.25rem",
            paddingBottom: "1rem",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {LOOKBOOK_IMAGES.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Lookbook image ${i + 1}`}
              loading="lazy"
              style={{
                height: "60vh",
                width: "auto",
                borderRadius: 12,
                flexShrink: 0,
                objectFit: "cover",
                scrollSnapAlign: "start",
              }}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div
      ref={wrapperRef}
      style={{ height: "400vh", position: "relative", background: "#0D0611" }}
      aria-label="Lookbook"
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Section header */}
        <div
          style={{
            position: "absolute",
            top: "3rem",
            left: "max(1.25rem, calc((100vw - 1200px) / 2))",
            zIndex: 4,
          }}
        >
          <p
            style={{
              fontSize: "0.68rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--gold)",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            Editorial
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.9rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Lookbook
          </h2>
        </div>

        {/* Scrolling image track */}
        <div
          ref={trackRef}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            height: "100%",
            paddingLeft: "max(1.25rem, calc((100vw - 1200px) / 2))",
            paddingRight: "5rem",
            willChange: "transform",
          }}
        >
          {LOOKBOOK_IMAGES.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Lookbook image ${i + 1}`}
              loading="lazy"
              style={{
                height: "73vh",
                width: "auto",
                borderRadius: 14,
                flexShrink: 0,
                objectFit: "cover",
                transform: `translateY(${i % 2 === 0 ? "-2.5%" : "2.5%"})`,
              }}
            />
          ))}
        </div>

        {/* Gold progress line */}
        <div
          style={{
            position: "absolute",
            bottom: "2rem",
            left: 0,
            right: 0,
            height: 1.5,
            background: "rgba(255,255,255,0.08)",
          }}
        >
          <div
            ref={progressRef}
            style={{
              height: "100%",
              width: "0%",
              background: "var(--gold)",
              transition: "width 0.08s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
