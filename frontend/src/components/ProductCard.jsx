import { Link } from "react-router-dom";
import { WHATSAPP_NUMBER } from "../api";

export default function ProductCard({ product }) {
  const waMsg = `Hello%2C%20I%20am%20interested%20in%20%22${encodeURIComponent(product.name)}%22.%20Please%20share%20more%20details.`;

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`} className="product-card-img-link">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="product-card-img"
            loading="lazy"
          />
        ) : (
          <div className="product-card-placeholder">
            <span style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>No Image</span>
          </div>
        )}
        {product.is_featured && <span className="product-card-badge">Featured</span>}
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
