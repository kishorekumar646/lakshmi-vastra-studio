import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, Heart, User, ChevronRight, Download } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { WHATSAPP_NUMBER } from "../api";
import { getInstallPrompt, clearInstallPrompt } from "../pwaInstall";

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 19, height: 19 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
  { to: "/catalog", label: "Collection" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { customer } = useAuth();
  const navigate = useNavigate();

  const close = () => setOpen(false);

  // Show install button only if not already running as standalone PWA
  const [showInstall, setShowInstall] = useState(false);
  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;
    if (!isStandalone) setShowInstall(true);
  }, []);

  const handleInstall = async () => {
    close();
    const prompt = getInstallPrompt();
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") clearInstallPrompt();
    } else {
      navigate("/install");
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo" onClick={close}>
          <span className="nav-logo-main">Lakshmi Vastra</span>
          <span className="nav-logo-sub">Studio</span>
        </Link>

        {/* Centre nav links — desktop */}
        <div className="nav-desktop-links">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right action icons — desktop */}
        <div className="nav-actions">
          <button
            className="nav-icon-btn"
            onClick={() => navigate("/wishlist")}
            aria-label="Wishlist"
            title="Wishlist"
          >
            <Heart size={19} />
            <span className="nav-icon-badge" style={{ opacity: wishlistCount === 0 ? 0.45 : 1 }}>
              {wishlistCount > 9 ? "9+" : wishlistCount}
            </span>
          </button>

          <button
            className="nav-icon-btn"
            onClick={() => navigate("/cart")}
            aria-label="Cart"
            title="Cart"
          >
            <ShoppingCart size={19} />
            {cartCount > 0 && (
              <span className="nav-icon-badge">{cartCount > 9 ? "9+" : cartCount}</span>
            )}
          </button>

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I need help with Lakshmi Vastra Studio. ")}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat on WhatsApp"
            title="Chat Support"
            className="nav-icon-btn"
            style={{ color: "#25D366" }}
          >
            {WA_SVG}
          </a>

          {showInstall && (
            <button
              onClick={handleInstall}
              className="nav-install-btn"
              title="Install App"
            >
              <Download size={14} />
              Install App
            </button>
          )}

          <div className="nav-divider" />

          {customer ? (
            <Link to="/account" className="nav-account-btn">
              <div className="nav-account-avatar">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              {customer.name.split(" ")[0]}
            </Link>
          ) : (
            <Link to="/account" className="nav-account-btn">
              <User size={15} />
              Sign In
            </Link>
          )}
        </div>

        {/* Hamburger — mobile */}
        <button
          className="nav-menu-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="nav-mobile-menu">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => "nav-mobile-link" + (isActive ? " active" : "")}
              onClick={close}
            >
              {l.label}
              <ChevronRight size={15} style={{ opacity: 0.4 }} />
            </NavLink>
          ))}

          <NavLink to="/wishlist" className="nav-mobile-link" onClick={close}>
            Wishlist
            {wishlistCount > 0
              ? <span className="nav-mobile-badge">{wishlistCount}</span>
              : <ChevronRight size={15} style={{ opacity: 0.4 }} />
            }
          </NavLink>

          <NavLink to="/cart" className="nav-mobile-link" onClick={close}>
            Cart
            {cartCount > 0
              ? <span className="nav-mobile-badge">{cartCount}</span>
              : <ChevronRight size={15} style={{ opacity: 0.4 }} />
            }
          </NavLink>

          <NavLink to="/account" className="nav-mobile-link" onClick={close}>
            {customer ? customer.name : "Sign In / Register"}
            <ChevronRight size={15} style={{ opacity: 0.4 }} />
          </NavLink>

          {showInstall && (
            <button
              className="nav-mobile-link nav-mobile-install"
              onClick={handleInstall}
            >
              <Download size={16} /> Install App
              <ChevronRight size={15} style={{ opacity: 0.4 }} />
            </button>
          )}

          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I need help with Lakshmi Vastra Studio. ")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-mobile-link"
            style={{ color: "#25D366", fontWeight: 700 }}
            onClick={close}
          >
            {WA_SVG} Chat Support
            <ChevronRight size={15} style={{ opacity: 0.4 }} />
          </a>
        </div>
      )}
    </nav>
  );
}
