import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { WHATSAPP_NUMBER } from "../api";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";

const DAY_MS = 86400000;

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const waMsg = `Hello%2C%20I%20am%20interested%20in%20%22${encodeURIComponent(product.name)}%22.%20Please%20share%20more%20details.`;
  const isNew = product.created_at && (Date.now() - new Date(product.created_at).getTime()) < 14 * DAY_MS;

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!customer) { navigate("/account"); return; }
    toggle(product.id);
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
        <button
          onClick={handleWishlist}
          style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(255,255,255,0.92)", border: "none", borderRadius: "50%",
            width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.15)", zIndex: 2,
          }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={17} fill={wishlisted ? "#8B1A1A" : "none"} color={wishlisted ? "#8B1A1A" : "#6B5744"} />
        </button>
      </Link>

      <div className="product-card-info">
        <p className="product-card-category">{product.category_name}</p>
        <h3 className="product-card-name">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-card-price">₹{product.price.toLocaleString("en-IN")}</p>

        <div className="product-card-actions">
          <Link to={`/product/${product.id}`} className="product-card-detail-btn">View Details</Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            className="product-card-wa-btn"
          >
            Enquire
          </a>
        </div>
      </div>
    </div>
  );
}
