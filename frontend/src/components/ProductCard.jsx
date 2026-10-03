import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Check } from "lucide-react";
import toast from "react-hot-toast";
import { WHATSAPP_NUMBER } from "../api";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";

const DAY_MS = 86400000;

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  const wishlisted = isWishlisted(product.id);
  const isNew = product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 14 * DAY_MS;

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!customer) { navigate("/account"); return; }
    toggle(product.id);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (adding || added) return;
    setAdding(true);
    try {
      await addItem(product, 1);
      setAdded(true);
      toast.success(`"${product.name}" added to cart`);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
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

        {/* Wishlist heart */}
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
            View Details
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="product-card-cart-btn"
            style={{
              background: added ? "#1a7a4a" : "var(--primary)",
              transition: "background 0.25s",
            }}
            aria-label="Add to cart"
          >
            {added
              ? <><Check size={14} /> Added</>
              : <><ShoppingCart size={14} /> Add to Cart</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
