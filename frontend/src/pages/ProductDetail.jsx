import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct, WHATSAPP_NUMBER, PHONE_NUMBER } from "../api";
import { ArrowLeft, Phone } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProduct(id)
      .then((r) => setProduct(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={styles.loading}>Loading...</div>;
  if (!product) return <div style={styles.loading}>Product not found.</div>;

  const waMsg = `Hello%2C%20I%20am%20interested%20in%20%22${encodeURIComponent(product.name)}%22%20(₹${product.price}).%20Please%20share%20more%20details.`;

  return (
    <div style={{ padding: "2rem 0 5rem" }}>
      <div className="container">
        <Link to="/catalog" style={styles.back}><ArrowLeft size={18} /> Back to Collection</Link>

        <div style={styles.grid}>
          <div style={styles.imgWrap}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={styles.img} />
            ) : (
              <div style={styles.placeholder}>No Image Available</div>
            )}
          </div>

          <div style={styles.info}>
            <p style={styles.category}>{product.category_name}</p>
            <h1 style={styles.name}>{product.name}</h1>
            <p style={styles.price}>₹{product.price.toLocaleString("en-IN")}</p>
            {product.description && <p style={styles.desc}>{product.description}</p>}

            <div style={styles.actions}>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
                target="_blank"
                rel="noreferrer"
                style={styles.waBtn}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.12 1.523 5.854L.057 23.893c-.072.303.197.571.499.499l6.086-1.469A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.213-3.724.899.916-3.635-.234-.373A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Enquire on WhatsApp
              </a>
              <a href={`tel:${PHONE_NUMBER}`} style={styles.callBtn}>
                <Phone size={18} /> Call Us
              </a>
            </div>

            <div style={styles.note}>
              <p>✓ Genuine handloom product</p>
              <p>✓ Available in multiple colours</p>
              <p>✓ Contact us for custom orders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  loading: { textAlign: "center", padding: "5rem 0", color: "#6B5744", fontSize: "1.1rem" },
  back: { display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#8B1A1A", textDecoration: "none", marginBottom: "2rem", fontWeight: 500 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "start" },
  imgWrap: { borderRadius: 12, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" },
  img: { width: "100%", display: "block", objectFit: "cover" },
  placeholder: { width: "100%", minHeight: 400, background: "#F5EFE6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C", fontSize: "1rem" },
  info: { paddingTop: "1rem" },
  category: { fontSize: "0.8rem", color: "#8B1A1A", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" },
  name: { fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#2C1810", marginBottom: "0.75rem" },
  price: { fontSize: "1.75rem", fontWeight: 700, color: "#8B1A1A", marginBottom: "1.5rem" },
  desc: { color: "#6B5744", lineHeight: 1.8, fontSize: "1rem", marginBottom: "2rem" },
  actions: { display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" },
  waBtn: { display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#25D366", color: "#fff", padding: "0.875rem 1.75rem", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: "1rem" },
  callBtn: { display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#8B1A1A", color: "#fff", padding: "0.875rem 1.75rem", borderRadius: 6, textDecoration: "none", fontWeight: 600, fontSize: "1rem" },
  note: { background: "#FDF8F0", borderRadius: 8, padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem", color: "#6B5744", fontSize: "0.9rem" },
};
