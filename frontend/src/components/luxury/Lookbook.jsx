import { useEffect, useRef, useState } from "react";
import { getProducts } from "../../api";

const FALLBACK_COLORS = ["#7B1D45", "#B8892A", "#2D2D6B", "#2D6B2D", "#6B3A0A", "#4A0A1A", "#591430", "#8B6914"];

function makeFallbackSvg(name, i) {
  const color = FALLBACK_COLORS[i % FALLBACK_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="380" height="560"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${color};stop-opacity:1"/><stop offset="100%" style="stop-color:#1A0E14;stop-opacity:0.8"/></linearGradient></defs><rect width="380" height="560" fill="url(#g)"/><text x="190" y="274" font-family="Georgia,serif" font-size="16" text-anchor="middle" fill="#D4A94A">${name || `Look ${i + 1}`}</text><text x="190" y="300" font-family="Georgia,serif" font-size="11" text-anchor="middle" fill="rgba(255,255,255,0.5)">Lakshmi Vastra Studio</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export default function Lookbook() {
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const progressRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [images, setImages] = useState([]);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fetch real product images
  useEffect(() => {
    getProducts()
      .then((r) => {
        const products = (r.data || []).slice(0, 8);
        const imgs = products.map((p, i) => ({
          src: p.image_url || makeFallbackSvg(p.name, i),
          alt: p.name,
        }));
        if (imgs.length > 0) setImages(imgs);
      })
      .catch(() => {});
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

  if (images.length === 0) return null;

  if (prefersReduced || isMobile) {
    return (
      <section style={{ background: "#0D0611", padding: "5rem 0 3rem" }} aria-label="Lookbook">
        <div className="container" style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.68rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "0.6rem" }}>
            Editorial
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 700, color: "#fff" }}>
            Lookbook
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            overflowX: "auto",
            overflowY: "hidden",
            paddingLeft: "1.25rem",
            paddingRight: "1.25rem",
            paddingBottom: "1.5rem",
            scrollSnapType: "x mandatory",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                scrollSnapAlign: "start",
                width: "72vw",
                maxWidth: 300,
                borderRadius: 14,
                overflow: "hidden",
                background: "#1A0E14",
              }}
            >
              <img
                src={img.src}
                alt={img.alt}
                style={{
                  width: "100%",
                  height: "90vw",
                  maxHeight: 340,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div ref={wrapperRef} style={{ height: "400vh", position: "relative", background: "#0D0611" }} aria-label="Lookbook">
      <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
        {/* Section header */}
        <div style={{ position: "absolute", top: "3rem", left: "max(1.25rem, calc((100vw - 1200px) / 2))", zIndex: 4 }}>
          <p style={{ fontSize: "0.68rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "0.5rem" }}>
            Editorial
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 700, color: "#fff" }}>
            Lookbook
          </h2>
        </div>

        {/* Scrolling image track */}
        <div
          ref={trackRef}
          style={{ display: "flex", alignItems: "center", gap: "1.5rem", height: "100%", paddingLeft: "max(1.25rem, calc((100vw - 1200px) / 2))", paddingRight: "5rem", willChange: "transform" }}
        >
          {images.map((img, i) => (
            <img
              key={i}
              src={img.src}
              alt={img.alt}
              loading="lazy"
              style={{ height: "73vh", width: "auto", borderRadius: 14, flexShrink: 0, objectFit: "cover", transform: `translateY(${i % 2 === 0 ? "-2.5%" : "2.5%"})` }}
            />
          ))}
        </div>

        {/* Gold progress line */}
        <div style={{ position: "absolute", bottom: "2rem", left: 0, right: 0, height: 1.5, background: "rgba(255,255,255,0.08)" }}>
          <div ref={progressRef} style={{ height: "100%", width: "0%", background: "var(--gold)", transition: "width 0.08s linear" }} />
        </div>
      </div>
    </div>
  );
}
