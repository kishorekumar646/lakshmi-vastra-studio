export default function PageBanner({ eyebrow, title, subtitle }) {
  return (
    <div
      style={{
        background: "linear-gradient(150deg,#0D0611 0%,#28092A 50%,#7B1D45 100%)",
        padding: "6rem 0 4rem",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      {[400, 600, 800].map((s, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.04)",
            width: s,
            height: s,
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
          }}
        />
      ))}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "0 1.5rem" }}>
        {eyebrow && (
          <p
            style={{
              fontSize: "0.68rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--gold)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2.2rem, 6vw, 4rem)",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.08,
            marginBottom: subtitle ? "1.25rem" : 0,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic",
              fontSize: "1.1rem",
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
