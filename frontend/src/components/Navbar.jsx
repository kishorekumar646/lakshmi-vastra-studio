import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ShoppingCart, Heart, User, ChevronRight } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
  { to: "/catalog", label: "Collection" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { customer } = useAuth();
  const navigate = useNavigate();

  const close = () => setOpen(false);

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
        </div>
      )}
    </nav>
  );
}
