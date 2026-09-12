import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { PHONE_NUMBER } from "../api";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/catalog", label: "Collection" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/" className="nav-logo" onClick={() => setOpen(false)}>
          <span className="nav-logo-main">Lakshmi Vastra</span>
          <span className="nav-logo-sub">Studio</span>
        </Link>

        <div className="nav-desktop-links">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {l.label}
            </NavLink>
          ))}
          <a href={`tel:${PHONE_NUMBER}`} className="nav-phone-btn">
            <Phone size={14} />
            {PHONE_NUMBER}
          </a>
        </div>

        <button
          className="nav-menu-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="nav-mobile-menu">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className="nav-mobile-link"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <a href={`tel:${PHONE_NUMBER}`} className="nav-mobile-link">
            <Phone size={15} style={{ marginRight: "0.5rem", color: "var(--gold)" }} />
            {PHONE_NUMBER}
          </a>
        </div>
      )}
    </nav>
  );
}
