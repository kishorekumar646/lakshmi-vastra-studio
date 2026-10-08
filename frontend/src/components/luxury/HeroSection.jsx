import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function HeroSection() {
  const imageRef = useRef(null);
  const headlineRef = useRef(null);
  const object3dRef = useRef(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* scroll parallax */
  useEffect(() => {
    if (prefersReduced) return;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / (window.innerHeight * 0.9), 1);
      if (imageRef.current) {
        imageRef.current.style.transform = `scale(${1.08 - progress * 0.2})`;
        imageRef.current.style.borderRadius = `${progress * 24}px`;
      }
      if (headlineRef.current) {
        headlineRef.current.style.transform = `translateY(${-scrollY * 0.18}px)`;
      }
      if (object3dRef.current) {
        object3dRef.current.style.transform = `translateY(${-scrollY * 0.08}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prefersReduced]);

  /* mouse parallax on the 3-D card */
  useEffect(() => {
    if (prefersReduced) return;
    const el = object3dRef.current;
    if (!el) return;
    const handleMouse = (e) => {
      const rx = ((e.clientY - window.innerHeight / 2) / (window.innerHeight / 2)) * -12;
      const ry = ((e.clientX - window.innerWidth / 2) / (window.innerWidth / 2)) * 12;
      el.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const handleLeave = () => {
      el.style.transform = "rotateX(0deg) rotateY(0deg)";
    };
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mouseleave", handleLeave);
    };
  }, [prefersReduced]);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "linear-gradient(150deg,#0D0611 0%,#28092A 45%,#7B1D45 100%)",
      }}
    >
      {/* Parallax background */}
      <div
        ref={imageRef}
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080"><defs><radialGradient id="rg" cx="60%" cy="40%" r="70%"><stop offset="0%" style="stop-color:#7B1D45;stop-opacity:0.6"/><stop offset="100%" style="stop-color:#0D0611;stop-opacity:0.95"/></radialGradient><pattern id="p" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="#D4A94A" opacity="0.15"/></pattern></defs><rect width="1920" height="1080" fill="#0D0611"/><rect width="1920" height="1080" fill="url(#p)"/><rect width="1920" height="1080" fill="url(#rg)"/></svg>'
          )}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          willChange: "transform, border-radius",
          transformOrigin: "center center",
          transform: "scale(1.08)",
        }}
      />

      {/* Noise overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* ── Two-column layout ── */}
      <div
        className="hero-grid"
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "9rem 2rem 5rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          gap: "4rem",
        }}
      >
        {/* LEFT — text */}
        <div ref={headlineRef} style={{ willChange: "transform" }}>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.7rem",
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: "var(--gold)",
              marginBottom: "1.5rem",
              opacity: 0.9,
            }}
          >
            Summer &lsquo;26 Collection
          </p>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.6rem, 5.5vw, 5.5rem)",
              fontWeight: 700,
              lineHeight: 1.04,
              color: "#fff",
              marginBottom: "0.6rem",
              letterSpacing: "-0.01em",
            }}
          >
            Lakshmi Vastra Studio
          </h1>

          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "clamp(1.3rem, 3vw, 2rem)",
              color: "var(--gold-light)",
              marginBottom: "1.75rem",
              letterSpacing: "0.02em",
            }}
          >
            Dressed in Poetry.
          </p>

          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "clamp(1rem, 2vw, 1.3rem)",
              color: "rgba(255,255,255,0.65)",
              marginBottom: "3rem",
              lineHeight: 1.6,
              maxWidth: 420,
            }}
          >
            Handcrafted for the modern Indian woman — tradition woven in every thread.
          </p>

          <div className="hero-cta-row" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              to="/shop"
              className="hero-cta-gold"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.95rem 2.4rem",
                borderRadius: "9999px",
                background: "var(--gold)",
                color: "#0D0611",
                fontWeight: 700,
                fontSize: "0.82rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "transform 0.22s, box-shadow 0.22s",
                boxShadow: "0 4px 20px rgba(184,137,42,0.35)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 36px rgba(184,137,42,0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(184,137,42,0.35)";
              }}
            >
              Shop the Collection
            </Link>
            <Link
              to="/lookbook"
              className="hero-cta-ghost"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.95rem 2.4rem",
                borderRadius: "9999px",
                background: "transparent",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.82rem",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                border: "1.5px solid rgba(255,255,255,0.45)",
                transition: "border-color 0.22s, background 0.22s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#fff";
                e.currentTarget.style.background = "rgba(255,255,255,0.09)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.45)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              ▶&nbsp; Watch the Film
            </Link>
          </div>
        </div>

        {/* RIGHT — 3-D floating card */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            perspective: "900px",
          }}
        >
          <div
            ref={object3dRef}
            style={{
              position: "relative",
              width: 340,
              height: 420,
              transformStyle: "preserve-3d",
              transition: "transform 0.12s ease-out",
              animation: prefersReduced ? "none" : "floatY 6s ease-in-out infinite",
            }}
          >
            {/* Card face */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 24,
                background:
                  "linear-gradient(135deg,rgba(212,169,74,0.18) 0%,rgba(123,29,69,0.35) 50%,rgba(13,6,17,0.9) 100%)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1.5px solid rgba(212,169,74,0.35)",
                boxShadow:
                  "0 0 0 1px rgba(212,169,74,0.08), 0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Shimmer sweep */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(105deg,transparent 40%,rgba(212,169,74,0.13) 50%,transparent 60%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 3.5s linear infinite",
                  pointerEvents: "none",
                }}
              />
              {/* Top gold line */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "15%",
                  right: "15%",
                  height: 2,
                  background:
                    "linear-gradient(90deg,transparent,rgba(212,169,74,0.9),transparent)",
                  borderRadius: 9999,
                }}
              />

              {/* SVG Lotus / Mandala */}
              <svg
                viewBox="0 0 260 280"
                width="220"
                height="240"
                style={{ filter: "drop-shadow(0 0 24px rgba(212,169,74,0.6))" }}
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="gold-center" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F5D78E" />
                    <stop offset="60%" stopColor="#D4A94A" />
                    <stop offset="100%" stopColor="#8B6914" />
                  </radialGradient>
                  <radialGradient id="petal-g" cx="50%" cy="0%" r="100%">
                    <stop offset="0%" stopColor="#F5D78E" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#7B1D45" stopOpacity="0.7" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Outer decorative dots */}
                {Array.from({ length: 16 }, (_, i) => {
                  const a = (i / 16) * Math.PI * 2;
                  return (
                    <circle
                      key={i}
                      cx={130 + Math.cos(a) * 118}
                      cy={140 + Math.sin(a) * 118}
                      r={i % 2 === 0 ? 3 : 1.5}
                      fill="#D4A94A"
                      opacity={i % 2 === 0 ? 0.7 : 0.4}
                    />
                  );
                })}

                {/* Outer rings */}
                <circle cx="130" cy="140" r="112" fill="none" stroke="rgba(212,169,74,0.3)" strokeWidth="1" />
                <circle cx="130" cy="140" r="96"  fill="none" stroke="rgba(212,169,74,0.2)" strokeWidth="0.5" />

                {/* 8 outer petals */}
                {Array.from({ length: 8 }, (_, i) => {
                  const a = (i / 8) * Math.PI * 2;
                  const x = 130 + Math.cos(a) * 68;
                  const y = 140 + Math.sin(a) * 68;
                  return (
                    <ellipse
                      key={i}
                      cx={x} cy={y} rx="18" ry="32"
                      fill="url(#petal-g)"
                      stroke="rgba(212,169,74,0.5)" strokeWidth="0.8"
                      transform={`rotate(${(i / 8) * 360},${x},${y})`}
                      opacity="0.8"
                      filter="url(#glow)"
                    />
                  );
                })}

                {/* 8 inner petals */}
                {Array.from({ length: 8 }, (_, i) => {
                  const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
                  const x = 130 + Math.cos(a) * 40;
                  const y = 140 + Math.sin(a) * 40;
                  return (
                    <ellipse
                      key={i}
                      cx={x} cy={y} rx="11" ry="22"
                      fill="url(#petal-g)"
                      stroke="rgba(212,169,74,0.6)" strokeWidth="0.6"
                      transform={`rotate(${(i / 8) * 360 + 22.5},${x},${y})`}
                      opacity="0.9"
                    />
                  );
                })}

                {/* Center jewel */}
                <circle cx="130" cy="140" r="22" fill="url(#gold-center)" filter="url(#glow)" />
                <circle cx="130" cy="140" r="14" fill="#0D0611" stroke="#D4A94A" strokeWidth="1.5" />
                <circle cx="130" cy="140" r="7"  fill="#D4A94A" opacity="0.9" />
                <circle cx="128" cy="138" r="2.5" fill="#fff" opacity="0.6" />

                {/* Saree drape hint */}
                <path
                  d="M 60 230 Q 90 200 130 220 Q 170 200 200 230 Q 185 260 130 265 Q 75 260 60 230 Z"
                  fill="rgba(212,169,74,0.18)"
                  stroke="rgba(212,169,74,0.5)"
                  strokeWidth="1"
                />
                <path d="M 80 235 Q 130 215 180 235" fill="none" stroke="rgba(212,169,74,0.4)" strokeWidth="0.8" />
              </svg>

              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "1rem",
                  color: "rgba(212,169,74,0.85)",
                  letterSpacing: "0.12em",
                  textAlign: "center",
                  marginTop: "-8px",
                }}
              >
                Pure Silk · Handwoven
              </p>

              {/* Bottom gold line */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "15%",
                  right: "15%",
                  height: 2,
                  background:
                    "linear-gradient(90deg,transparent,rgba(212,169,74,0.9),transparent)",
                  borderRadius: 9999,
                }}
              />
            </div>

            {/* Glow halo */}
            <div
              style={{
                position: "absolute",
                inset: -24,
                borderRadius: 40,
                background:
                  "radial-gradient(ellipse at center,rgba(212,169,74,0.18) 0%,transparent 70%)",
                animation: "pulseGlow 4s ease-in-out infinite",
                zIndex: -1,
              }}
            />
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 3,
          opacity: 0.4,
        }}
      >
        <div
          style={{
            width: 1,
            height: 48,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.6))",
            animation: "scrollHint 2s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes scrollHint {
          0%, 100% { opacity: 0.3; transform: scaleY(0.6); transform-origin: top; }
          50%        { opacity: 0.7; transform: scaleY(1);   transform-origin: top; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px)   rotateY(0deg); }
          33%       { transform: translateY(-14px) rotateY(4deg); }
          66%       { transform: translateY(-6px)  rotateY(-3deg); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-grid > div:last-child { order: -1; }
        }
      `}</style>
    </section>
  );
}
