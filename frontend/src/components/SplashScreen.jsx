import { useEffect, useState } from "react";

export default function SplashScreen({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 3800);
    const t2 = setTimeout(onDone, 4600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      background: "linear-gradient(150deg, #0D0611 0%, #28092A 45%, #7B1D45 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      opacity: fading ? 0 : 1,
      transition: "opacity 0.8s ease",
      userSelect: "none",
    }}>
      {/* Decorative ring */}
      <div style={{
        position: "absolute",
        width: 340,
        height: 340,
        borderRadius: "50%",
        border: "1px solid rgba(184,137,42,0.12)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        width: 420,
        height: 420,
        borderRadius: "50%",
        border: "1px solid rgba(184,137,42,0.06)",
        pointerEvents: "none",
      }} />

      {/* Main content — animates in */}
      <div style={{ textAlign: "center", animation: "splashIn 0.9s ease forwards", padding: "0 2rem" }}>

        {/* Logo icon */}
        <div style={{ marginBottom: "1.75rem", animation: "splashIconPulse 2.8s ease 1s infinite" }}>
          <img
            src="/icon-512.svg"
            alt="Lakshmi Vastra Studio"
            style={{ width: 110, height: 110, borderRadius: 24 }}
          />
        </div>

        {/* Gold divider */}
        <div style={{
          width: 70,
          height: 1,
          background: "linear-gradient(to right, transparent, #B8892A, transparent)",
          margin: "0 auto 1.5rem",
        }} />

        {/* Store name */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.7rem, 6vw, 2.2rem)",
          color: "#fff",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          marginBottom: "0.5rem",
          lineHeight: 1.15,
        }}>
          Lakshmi Vastra Studio
        </h1>

        {/* Italic tagline */}
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "clamp(1rem, 3.5vw, 1.2rem)",
          color: "var(--gold-light, #D4A94A)",
          marginBottom: "1.25rem",
          letterSpacing: "0.03em",
        }}>
          Exquisite Sarees &amp; Ethnic Wear
        </p>

        {/* Product description pills */}
        <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "3rem" }}>
          {["Authentic Handlooms", "Kanjivaram · Banarasi", "Custom Orders"].map((t) => (
            <span key={t} style={{
              background: "rgba(184,137,42,0.14)",
              border: "1px solid rgba(184,137,42,0.28)",
              color: "rgba(255,255,255,0.72)",
              borderRadius: 100,
              padding: "0.28rem 0.85rem",
              fontSize: "0.72rem",
              letterSpacing: "0.06em",
              fontWeight: 500,
            }}>
              {t}
            </span>
          ))}
        </div>

        {/* Loading dots */}
        <div style={{ display: "flex", gap: "0.55rem", justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#B8892A",
              animation: `splashDot 1.3s ease ${i * 0.22}s infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* Bottom address */}
      <p style={{
        position: "absolute",
        bottom: "2rem",
        color: "rgba(255,255,255,0.28)",
        fontSize: "0.72rem",
        letterSpacing: "0.08em",
        textAlign: "center",
      }}>
        Gooty RS, Anantapur – 515402
      </p>

      <style>{`
        @keyframes splashIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashIconPulse {
          0%, 100% { filter: drop-shadow(0 0 0px rgba(184,137,42,0)); }
          50%       { filter: drop-shadow(0 0 18px rgba(184,137,42,0.55)); }
        }
        @keyframes splashDot {
          0%, 60%, 100% { transform: translateY(0);     opacity: 0.35; }
          30%            { transform: translateY(-9px);  opacity: 1; }
        }
      `}</style>
    </div>
  );
}
