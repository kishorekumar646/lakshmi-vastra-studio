import { Link } from "react-router-dom";
import { Phone, MapPin, Clock } from "lucide-react";
import { PHONE_NUMBER, WHATSAPP_NUMBER } from "../api";

const WA_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: "#0A050E", color: "#C9BAB2" }}>

      {/* ── Trust strip ── */}
      <div style={{
        borderTop: "1px solid rgba(184,137,42,0.2)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(184,137,42,0.06)",
        padding: "1.25rem 1.5rem",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", gap: "2rem", flexWrap: "wrap", justifyContent: "center", alignItems: "center",
        }}>
          {[
            { icon: "🔒", label: "Secure Payments" },
            { icon: "🚚", label: "Free Delivery" },
            { icon: "↩️", label: "7-Day Returns" },
            { icon: "🥻", label: "Authentic Handloom" },
            { icon: "💬", label: "WhatsApp Support" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1rem" }}>{icon}</span>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(201,186,178,0.85)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main footer grid ── */}
      <div className="footer-grid">
        {/* Brand column */}
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <p style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: "1.45rem", fontWeight: 700, marginBottom: "0.25rem", letterSpacing: "-0.01em" }}>
              Lakshmi Vastra Studio
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", color: "var(--gold-light, #D4A94A)", fontSize: "0.82rem", letterSpacing: "0.18em" }}>
              Dressed in Poetry.
            </p>
          </div>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.8, color: "#897D78", maxWidth: 280 }}>
            Celebrating the timeless beauty of Indian handloom — tradition, elegance, and artistry woven in every drape.
          </p>

          {/* Social row */}
          <div style={{ display: "flex", gap: "0.65rem", marginTop: "1.75rem" }}>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank" rel="noreferrer"
              aria-label="WhatsApp"
              style={{
                width: 38, height: 38, borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#B0A09A", transition: "border-color 0.2s, color 0.2s, background 0.2s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "#25D366"; e.currentTarget.style.color = "#25D366"; e.currentTarget.style.background = "rgba(37,211,102,0.08)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#B0A09A"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            >
              {WA_SVG}
            </a>
            <a
              href={`tel:${PHONE_NUMBER}`}
              aria-label="Call us"
              style={{
                width: 38, height: 38, borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#B0A09A", transition: "border-color 0.2s, color 0.2s, background 0.2s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold-light)"; e.currentTarget.style.background = "rgba(184,137,42,0.08)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#B0A09A"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
            >
              <Phone size={15} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: "var(--gold)", marginBottom: "1.4rem", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700 }}>
            Quick Links
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {[
              { to: "/", label: "Home" },
              { to: "/shop", label: "Shop" },
              { to: "/catalog", label: "Collection" },
              { to: "/about", label: "About Us" },
              { to: "/contact", label: "Contact" },
            ].map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  style={{ color: "#897D78", textDecoration: "none", fontSize: "0.88rem", transition: "color 0.2s", display: "flex", alignItems: "center", gap: "0.4rem" }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "var(--gold-light)")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "#897D78")}
                >
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "rgba(184,137,42,0.4)", flexShrink: 0 }} />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ color: "var(--gold)", marginBottom: "1.4rem", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700 }}>
            Get in Touch
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <li style={{ display: "flex", alignItems: "center", gap: "0.7rem", fontSize: "0.875rem" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(184,137,42,0.1)", border: "1px solid rgba(184,137,42,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Phone size={13} style={{ color: "var(--gold)" }} />
              </div>
              <a href={`tel:${PHONE_NUMBER}`} style={{ color: "#B0A09A", textDecoration: "none" }}>{PHONE_NUMBER}</a>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", fontSize: "0.875rem" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(184,137,42,0.1)", border: "1px solid rgba(184,137,42,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <MapPin size={13} style={{ color: "var(--gold)" }} />
              </div>
              <span style={{ color: "#897D78", lineHeight: 1.65 }}>Tholu Shopu Street, Near Water Tank,<br />Gooty RS, Anantapur – 515402</span>
            </li>
            <li style={{ display: "flex", alignItems: "flex-start", gap: "0.7rem", fontSize: "0.875rem" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(184,137,42,0.1)", border: "1px solid rgba(184,137,42,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <Clock size={13} style={{ color: "var(--gold)" }} />
              </div>
              <span style={{ color: "#897D78", lineHeight: 1.65 }}>Mon–Sat: 10am – 8pm<br />Sunday: 11am – 6pm</span>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "1.25rem 2rem",
        maxWidth: 1200,
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <p style={{ fontSize: "0.78rem", color: "#574E4A" }}>
          © {new Date().getFullYear()} Lakshmi Vastra Studio. All rights reserved. Crafted with care in India.
        </p>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          {[{ to: "/privacy", label: "Privacy" }, { to: "/terms", label: "Terms" }, { to: "/cookies", label: "Cookies" }].map((l) => (
            <Link key={l.to} to={l.to} style={{ fontSize: "0.75rem", color: "#574E4A", textDecoration: "none", transition: "color 0.2s" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#897D78")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#574E4A")}
            >{l.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
