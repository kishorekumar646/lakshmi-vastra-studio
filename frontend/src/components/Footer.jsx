import { Link } from "react-router-dom";
import { Phone, MapPin } from "lucide-react";
import { PHONE_NUMBER, WHATSAPP_NUMBER } from "../api";

export default function Footer() {
  return (
    <footer style={{ background: "#0F080D", color: "#C9BAB2" }}>
      <div className="footer-grid">
        {/* Brand */}
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.2rem" }}>
              Lakshmi Vastra Studio
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--gold)", fontSize: "0.8rem", letterSpacing: "0.15em" }}>
              Est. with love for Indian craft
            </p>
          </div>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.75, color: "#897D78", maxWidth: 280 }}>
            Celebrating the timeless beauty of Indian handloom — tradition, elegance, and artistry in every drape.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: "var(--gold)", marginBottom: "1.25rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
            Quick Links
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {[{ to: "/", label: "Home" }, { to: "/catalog", label: "Collection" }, { to: "/contact", label: "Contact Us" }].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  style={{ color: "#B0A09A", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}
                  onMouseOver={(e) => (e.target.style.color = "#fff")}
                  onMouseOut={(e) => (e.target.style.color = "#B0A09A")}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ color: "var(--gold)", marginBottom: "1.25rem", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
            Get in Touch
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.875rem" }}>
              <Phone size={14} style={{ color: "var(--gold)", flexShrink: 0 }} />
              <a href={`tel:${PHONE_NUMBER}`} style={{ color: "#B0A09A", textDecoration: "none" }}>{PHONE_NUMBER}</a>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", fontSize: "0.875rem" }}>
              <MapPin size={14} style={{ color: "var(--gold)", flexShrink: 0, marginTop: "2px" }} />
              <span style={{ color: "#897D78" }}>Your City, India</span>
            </li>
          </ul>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
            {/* Instagram */}
            <a href="#" aria-label="Instagram"
              style={{ width: 36, height: 36, borderRadius: 4, border: "1px solid #2A1E24", display: "flex", alignItems: "center", justifyContent: "center", color: "#B0A09A", transition: "border-color 0.2s, color 0.2s" }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2A1E24"; e.currentTarget.style.color = "#B0A09A"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            {/* Facebook */}
            <a href="#" aria-label="Facebook"
              style={{ width: 36, height: 36, borderRadius: 4, border: "1px solid #2A1E24", display: "flex", alignItems: "center", justifyContent: "center", color: "#B0A09A", transition: "border-color 0.2s, color 0.2s" }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2A1E24"; e.currentTarget.style.color = "#B0A09A"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            {/* WhatsApp */}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"
              style={{ width: 36, height: 36, borderRadius: 4, border: "1px solid #2A1E24", display: "flex", alignItems: "center", justifyContent: "center", color: "#B0A09A", transition: "border-color 0.2s, color 0.2s" }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#25D366"; e.currentTarget.style.color = "#25D366"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "#2A1E24"; e.currentTarget.style.color = "#B0A09A"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.12 1.523 5.854L.057 23.893c-.072.303.197.571.499.499l6.086-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.213-3.724.899.916-3.635-.234-.373A9.818 9.818 0 1112 21.818z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #1E1118", textAlign: "center", padding: "1.25rem 1.5rem", fontSize: "0.8rem", color: "#574E4A" }}>
        <p>© {new Date().getFullYear()} Lakshmi Vastra Studio. All rights reserved. Crafted with care in India.</p>
      </div>
    </footer>
  );
}
