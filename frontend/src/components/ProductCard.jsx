import { Link } from "react-router-dom";
import { WHATSAPP_NUMBER } from "../api";

export default function ProductCard({ product }) {
  const waMsg = `Hello%2C%20I%20am%20interested%20in%20%22${encodeURIComponent(product.name)}%22.%20Please%20share%20more%20details.`;

  return (
    <div style={styles.card}>
      <Link to={`/product/${product.id}`} style={styles.imgLink}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} style={styles.img} loading="lazy" />
        ) : (
          <div style={styles.placeholder}>
            <span style={styles.placeholderText}>No Image</span>
          </div>
        )}
        {product.is_featured && <span style={styles.badge}>Featured</span>}
      </Link>

      <div style={styles.info}>
        <p style={styles.category}>{product.category_name}</p>
        <h3 style={styles.name}>
          <Link to={`/product/${product.id}`} style={styles.nameLink}>{product.name}</Link>
        </h3>
        <p style={styles.price}>₹{product.price.toLocaleString("en-IN")}</p>

        <div style={styles.actions}>
          <Link to={`/product/${product.id}`} style={styles.detailBtn}>View Details</Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
            target="_blank"
            rel="noreferrer"
            style={styles.waBtn}
          >
            Enquire
          </a>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", transition: "transform 0.2s, box-shadow 0.2s" },
  imgLink: { display: "block", position: "relative" },
  img: { width: "100%", height: 280, objectFit: "cover", display: "block" },
  placeholder: { width: "100%", height: 280, background: "#F5EFE6", display: "flex", alignItems: "center", justifyContent: "center" },
  placeholderText: { color: "#C9A84C", fontFamily: "'Playfair Display', serif", fontSize: "1rem" },
  badge: { position: "absolute", top: 12, left: 12, background: "#C9A84C", color: "#2C1810", padding: "0.25rem 0.75rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600 },
  info: { padding: "1.25rem" },
  category: { fontSize: "0.75rem", color: "#8B1A1A", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" },
  name: { fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", marginBottom: "0.5rem" },
  nameLink: { textDecoration: "none", color: "#2C1810" },
  price: { fontSize: "1.25rem", fontWeight: 700, color: "#8B1A1A", marginBottom: "1rem" },
  actions: { display: "flex", gap: "0.75rem" },
  detailBtn: { flex: 1, textAlign: "center", padding: "0.6rem", border: "1px solid #8B1A1A", color: "#8B1A1A", borderRadius: 4, textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 },
  waBtn: { flex: 1, textAlign: "center", padding: "0.6rem", background: "#25D366", color: "#fff", borderRadius: 4, textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 },
};
