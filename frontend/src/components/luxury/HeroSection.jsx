import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function HeroSection() {
  const imageRef = useRef(null);
  const headlineRef = useRef(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / (window.innerHeight * 0.9), 1);

      if (imageRef.current) {
        const scale = 1.08 - progress * 0.2;
        const radius = progress * 24;
        imageRef.current.style.transform = `scale(${scale})`;
        imageRef.current.style.borderRadius = `${radius}px`;
      }
      if (headlineRef.current) {
        headlineRef.current.style.transform = `translateY(${-scrollY * 0.18}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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
      {/* Parallax background image */}
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

      {/* Noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          padding: "9rem 1.5rem 5rem",
          maxWidth: 860,
          margin: "0 auto",
          willChange: "transform",
        }}
      >
        {/* Eyebrow */}
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

        {/* Brand name headline */}
        <div
          ref={headlineRef}
          style={{ willChange: "transform" }}
        >
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.6rem, 8vw, 6.5rem)",
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
              fontSize: "clamp(1.3rem, 3.5vw, 2.2rem)",
              color: "var(--gold-light)",
              marginBottom: "1.75rem",
              letterSpacing: "0.02em",
            }}
          >
            Dressed in Poetry.
          </p>
        </div>

        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "clamp(1rem, 2.5vw, 1.45rem)",
            color: "rgba(255,255,255,0.65)",
            marginBottom: "3rem",
            maxWidth: 460,
            margin: "0 auto 3rem",
            lineHeight: 1.6,
          }}
        >
          Handcrafted for the modern Indian woman — tradition woven in every
          thread.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/shop"
            className="hero-cta-gold"
            style={{
              display: "inline-flex",
              alignItems: "center",
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
              e.currentTarget.style.boxShadow =
                "0 10px 36px rgba(184,137,42,0.55)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(184,137,42,0.35)";
            }}
          >
            Shop the Collection
          </Link>
          <Link
            to="/catalog"
            style={{
              display: "inline-flex",
              alignItems: "center",
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
            Watch the Film
          </Link>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            position: "absolute",
            bottom: "-3rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
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
      </div>

      <style>{`
        @keyframes scrollHint {
          0%, 100% { opacity: 0.3; transform: scaleY(0.6); transform-origin: top; }
          50% { opacity: 0.7; transform: scaleY(1); transform-origin: top; }
        }
      `}</style>
    </section>
  );
}
