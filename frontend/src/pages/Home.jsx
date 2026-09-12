import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, getCategories, WHATSAPP_NUMBER } from "../api";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getProducts({ featured: true }).then((r) => setFeatured(r.data.slice(0, 6)));
    getCategories().then((r) => setCategories(r.data));
  }, []);

  return (
    <>
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <p style={styles.heroSub}>Welcome to</p>
          <h1 style={styles.heroTitle}>Lakshmi Vastra Studio</h1>
          <p style={styles.heroTagline}>Exquisite Sarees & Ethnic Wear — Tradition Woven in Every Thread</p>
          <div style={styles.heroBtns}>
            <Link to="/catalog" className="btn-gold">Explore Collection</Link>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%27d%20like%20to%20know%20more%20about%20your%20collection.`} target="_blank" rel="noreferrer" className="btn-primary">Chat on WhatsApp</a>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={styles.section}>
          <div className="container">
            <h2 className="section-title">Shop by Category</h2>
            <div className="section-divider" />
            <div style={styles.catGrid}>
              {categories.map((cat) => (
                <Link key={cat.id} to={`/catalog?category=${cat.id}`} style={styles.catCard}>
                  <span style={styles.catName}>{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section style={{ ...styles.section, background: "#FDF8F0" }}>
        <div className="container">
          <h2 className="section-title">Featured Collection</h2>
          <div className="section-divider" />
          {featured.length > 0 ? (
            <>
              <div style={styles.productGrid}>
                {featured.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
                <Link to="/catalog" className="btn-primary">View All Products</Link>
              </div>
            </>
          ) : (
            <p style={styles.empty}>New arrivals coming soon. <Link to="/contact">Contact us</Link> to inquire.</p>
          )}
        </div>
      </section>

      {/* Why Us */}
      <section style={styles.section}>
        <div className="container">
          <h2 className="section-title">Why Choose Us</h2>
          <div className="section-divider" />
          <div style={styles.whyGrid}>
            {[
              { icon: "🪡", title: "Authentic Handlooms", desc: "Direct from weavers across India — genuine craftsmanship." },
              { icon: "✨", title: "Premium Quality", desc: "Every saree is carefully selected for quality and beauty." },
              { icon: "💬", title: "Personal Assistance", desc: "WhatsApp us anytime — we guide you to the perfect choice." },
              { icon: "🚚", title: "Doorstep Delivery", desc: "We deliver across India with care and love." },
            ].map((item) => (
              <div key={item.title} style={styles.whyCard}>
                <div style={styles.whyIcon}>{item.icon}</div>
                <h3 style={styles.whyTitle}>{item.title}</h3>
                <p style={styles.whyDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2 style={{ ...styles.heroTitle, fontSize: "2rem", marginBottom: "1rem" }}>Ready to Find Your Perfect Saree?</h2>
          <p style={{ color: "#E8D5C4", marginBottom: "2rem", fontSize: "1.1rem" }}>Message us on WhatsApp or visit our store today.</p>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="btn-gold">Chat Now on WhatsApp</a>
        </div>
      </section>
    </>
  );
}

const styles = {
  hero: { position: "relative", minHeight: "90vh", background: "linear-gradient(135deg, #8B1A1A 0%, #2C1810 60%, #C9A84C 100%)", display: "flex", alignItems: "center", justifyContent: "center" },
  heroOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" },
  heroContent: { position: "relative", textAlign: "center", padding: "2rem 1.5rem", maxWidth: 700 },
  heroSub: { color: "#C9A84C", fontSize: "1rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.5rem" },
  heroTitle: { fontFamily: "'Playfair Display', serif", fontSize: "3.5rem", color: "#fff", marginBottom: "1rem", lineHeight: 1.2 },
  heroTagline: { color: "#E8D5C4", fontSize: "1.15rem", marginBottom: "2rem", lineHeight: 1.6 },
  heroBtns: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" },
  section: { padding: "5rem 0" },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" },
  catCard: { background: "linear-gradient(135deg, #8B1A1A, #C9474A)", borderRadius: 8, padding: "2rem 1rem", textAlign: "center", textDecoration: "none", transition: "transform 0.2s" },
  catName: { color: "#fff", fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 600 },
  productGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" },
  empty: { textAlign: "center", color: "#6B5744", fontSize: "1.1rem", padding: "3rem 0" },
  whyGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "2rem" },
  whyCard: { textAlign: "center", padding: "2rem 1.5rem", border: "1px solid #F0E8D8", borderRadius: 8 },
  whyIcon: { fontSize: "2.5rem", marginBottom: "1rem" },
  whyTitle: { fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", color: "#8B1A1A", marginBottom: "0.75rem" },
  whyDesc: { color: "#6B5744", lineHeight: 1.6, fontSize: "0.95rem" },
  cta: { background: "linear-gradient(135deg, #8B1A1A, #2C1810)", padding: "5rem 0" },
};
