import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { PHONE_NUMBER } from "../api";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/catalog", label: "Collection" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav style={styles.nav}>
      <div className="container" style={styles.inner}>
        <Link to="/" style={styles.logo}>
          <span style={styles.logoMain}>Lakshmi Vastra</span>
          <span style={styles.logoSub}>Studio</span>
        </Link>

        <div style={styles.desktopLinks}>
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.linkActive : {}) })}
            >
              {l.label}
            </NavLink>
          ))}
          <a href={`tel:${PHONE_NUMBER}`} style={styles.phoneBtn}>
            <Phone size={16} />
            {PHONE_NUMBER}
          </a>
        </div>

        <button style={styles.menuBtn} onClick={() => setOpen(!open)}>
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {open && (
        <div style={styles.mobileMenu}>
          {navLinks.map((l) => (
            <NavLink key={l.to} to={l.to} style={styles.mobileLink} onClick={() => setOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <a href={`tel:${PHONE_NUMBER}`} style={styles.mobileLink}>
            {PHONE_NUMBER}
          </a>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: { background: "#fff", borderBottom: "2px solid #8B1A1A", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  inner: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 70 },
  logo: { textDecoration: "none", display: "flex", flexDirection: "column", lineHeight: 1.1 },
  logoMain: { fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700, color: "#8B1A1A" },
  logoSub: { fontFamily: "'Playfair Display', serif", fontSize: "0.75rem", color: "#C9A84C", letterSpacing: "0.15em", textTransform: "uppercase" },
  desktopLinks: { display: "flex", alignItems: "center", gap: "2rem", "@media(maxWidth:768px)": { display: "none" } },
  link: { textDecoration: "none", color: "#2C1810", fontWeight: 500, fontSize: "0.95rem", transition: "color 0.2s" },
  linkActive: { color: "#8B1A1A", borderBottom: "2px solid #8B1A1A", paddingBottom: "2px" },
  phoneBtn: { display: "flex", alignItems: "center", gap: "0.4rem", background: "#8B1A1A", color: "#fff", padding: "0.5rem 1rem", borderRadius: 4, textDecoration: "none", fontSize: "0.9rem" },
  menuBtn: { display: "none", background: "none", border: "none", cursor: "pointer", color: "#8B1A1A" },
  mobileMenu: { background: "#fff", borderTop: "1px solid #eee", padding: "1rem" },
  mobileLink: { display: "block", padding: "0.75rem 0", textDecoration: "none", color: "#2C1810", borderBottom: "1px solid #f0f0f0", fontWeight: 500 },
};
