import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page Not Found | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

  return (
    <div style={{
      minHeight: "72vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "4rem 1.5rem",
      background: "var(--cream)",
    }}>
      <span style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontStyle: "italic",
        color: "var(--gold)",
        fontSize: "1.1rem",
        letterSpacing: "0.1em",
        marginBottom: "0.75rem",
        display: "block",
      }}>404</span>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(2rem, 5vw, 2.8rem)",
        color: "var(--text)",
        fontWeight: 700,
        marginBottom: "0.75rem",
        lineHeight: 1.15,
      }}>Page Not Found</h1>
      <div style={{ width: 60, height: 1, background: "var(--gold)", margin: "0 auto 1.5rem", opacity: 0.6 }} />
      <p style={{ color: "var(--text-muted)", marginBottom: "2.5rem", maxWidth: 400, lineHeight: 1.75, fontSize: "0.975rem" }}>
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/" className="btn-primary">Go Home</Link>
        <Link to="/catalog" className="btn-outline">View Collection</Link>
      </div>
    </div>
  );
}
