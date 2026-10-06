import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Check, Eye, MapPin, X, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { checkPincode } from "../api";

const DAY_MS = 86400000;

const PIN_CACHE_KEY = (pin) => `lvs_pin_ok_${pin}`;

function getCachedPin(pin) {
  try { return sessionStorage.getItem(PIN_CACHE_KEY(pin)); } catch { return null; }
}
function setCachedPin(pin, val) {
  try { sessionStorage.setItem(PIN_CACHE_KEY(pin), val); } catch { /* noop */ }
}

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [pop, setPop] = useState(false);

  // Delivery check modal
  const [showPin, setShowPin]         = useState(false);
  const [pinInput, setPinInput]       = useState("");
  const [pinChecking, setPinChecking] = useState(false);
  const [pinResult, setPinResult]     = useState(null); // null | {serviceable, city, state}

  const wishlisted = isWishlisted(product.id);
  const isNew = product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 14 * DAY_MS;

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!customer) { navigate("/account"); return; }
    toggle(product.id);
  };

  const doAdd = async () => {
    setAdding(true);
    try {
      await addItem(product, 1);
      setAdded(true);
      setPop(true);
      setTimeout(() => setPop(false), 400);
      toast.success(`"${product.name}" added to cart`);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (adding || added) return;

    // Guest: add directly, no pincode check needed
    if (!customer) {
      doAdd();
      return;
    }

    const savedPin = customer.pincode?.trim();
    // Already verified this session
    if (savedPin && getCachedPin(savedPin) === "yes") {
      doAdd();
      return;
    }

    // Known bad pincode
    if (savedPin && getCachedPin(savedPin) === "no") {
      toast.error(`We don't deliver to ${savedPin} yet. Update your address to continue.`);
      return;
    }

    // Need to show verify modal
    setPinInput(savedPin || "");
    setPinResult(null);
    setShowPin(true);
  };

  const handlePinCheck = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pinInput)) { toast.error("Enter a valid 6-digit PIN code"); return; }
    setPinChecking(true);
    try {
      const { data } = await checkPincode(pinInput);
      setPinResult(data);
      if (data.serviceable) {
        setCachedPin(pinInput, "yes");
      } else {
        setCachedPin(pinInput, "no");
      }
    } catch {
      setPinResult({ serviceable: false });
    } finally {
      setPinChecking(false);
    }
  };

  const handleConfirmAdd = () => {
    setShowPin(false);
    setPinResult(null);
    doAdd();
  };

  return (
    <>
      <div className="product-card">
        <Link to={`/product/${product.id}`} className="product-card-img-link">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="product-card-img"
              loading="lazy"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <div className="product-card-placeholder">
              <span style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>No Image</span>
            </div>
          )}
          {product.is_featured && <span className="product-card-badge">Featured</span>}
          {isNew && !product.is_featured && (
            <span className="product-card-badge" style={{ background: "#1a7a4a" }}>New</span>
          )}

          <button
            onClick={handleWishlist}
            style={{
              position: "absolute", top: 10, right: 10,
              background: wishlisted ? "var(--primary)" : "rgba(255,255,255,0.92)",
              border: "none", borderRadius: "50%",
              width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", zIndex: 2,
              transition: "background 0.2s, transform 0.15s",
            }}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={16} fill={wishlisted ? "#fff" : "none"} color={wishlisted ? "#fff" : "#6B5744"} />
          </button>
        </Link>

        <div className="product-card-info">
          <p className="product-card-category">{product.category_name}</p>
          <h3 className="product-card-name">
            <Link to={`/product/${product.id}`}>{product.name}</Link>
          </h3>
          <p className="product-card-price">₹{product.price.toLocaleString("en-IN")}</p>

          <div className="product-card-actions">
            <Link to={`/product/${product.id}`} className="product-card-detail-btn">
              <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Eye size={14} />
                View Details
              </span>
            </Link>
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className={`product-card-cart-btn${added ? " added" : ""}${pop ? " pop" : ""}`}
              aria-label="Add to cart"
            >
              {added
                ? <><Check size={14} /> Added to Cart</>
                : <><ShoppingCart size={14} /> Add to Cart</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* Delivery check modal */}
      {showPin && (
        <div className="pin-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPin(false); }}>
          <div className="pin-modal">
            <div className="pin-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={18} color="var(--primary)" />
                <span className="pin-modal-title">Check Delivery Availability</span>
              </div>
              <button className="pin-modal-close" onClick={() => setShowPin(false)}><X size={18} /></button>
            </div>

            <p className="pin-modal-sub">Enter your 6-digit PIN code to check if we deliver to your area.</p>

            <form onSubmit={handlePinCheck} className="pin-modal-form">
              <input
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setPinResult(null); }}
                placeholder="Enter PIN code"
                maxLength={6}
                autoFocus
                className="pin-modal-input"
              />
              <button
                type="submit"
                disabled={pinChecking || pinInput.length !== 6}
                className="pin-modal-check-btn"
              >
                {pinChecking ? "Checking…" : "Check"}
              </button>
            </form>

            {pinResult && (
              <div className={`pin-modal-result ${pinResult.serviceable ? "ok" : "err"}`}>
                {pinResult.serviceable ? (
                  <>
                    <CheckCircle size={16} />
                    Delivery available{pinResult.city ? ` in ${pinResult.city}${pinResult.state ? `, ${pinResult.state}` : ""}` : ""}!
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    Sorry, we don't deliver to <strong>{pinInput}</strong> yet.
                  </>
                )}
              </div>
            )}

            {pinResult?.serviceable && (
              <button className="btn-primary pin-modal-add-btn" onClick={handleConfirmAdd}>
                <ShoppingCart size={15} /> Add to Cart
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
