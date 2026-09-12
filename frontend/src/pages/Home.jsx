import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, getCategories, WHATSAPP_NUMBER } from "../api";
import ProductCard from "../components/ProductCard";
import { ProductCardSkeleton } from "../components/Skeleton";

const WHY_US = [
  { icon: "🪡", title: "Authentic Handlooms", desc: "Sourced directly from master weavers across India — every piece tells a story." },
  { icon: "✨", title: "Curated Quality", desc: "Each saree is handpicked for its craftsmanship, colour, and finish." },
  { icon: "💬", title: "Personal Guidance", desc: "Our team is available on WhatsApp to help you find the perfect match." },
  { icon: "🚚", title: "Local Delivery", desc: "Fast, safe delivery within our local area — right to your doorstep." },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);

  useEffect(() => {
    document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear";
    getProducts({ featured: true })
      .then((r) => setFeatured(r.data.slice(0, 6)))
      .finally(() => setFeaturedLoading(false));
    getCategories().then((r) => setCategories(r.data));
  }, []);

  return (
    <>
      {/* ── Hero ────────────────────── */}
      <section className="hero-section">
        <div className="hero-content">
          <span className="hero-eyebrow">Est. with love for Indian craft</span>
          <h1 className="hero-title">Lakshmi Vastra Studio</h1>
          <div className="hero-divider" />
          <p className="hero-tagline">
            Exquisite sarees & ethnic wear — tradition woven in every thread
          </p>
          <div className="hero-btns">
            <Link to="/catalog" className="btn-gold">Explore Collection</Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%27d%20like%20to%20know%20more%20about%20your%20collection.`}
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              Chat on WhatsApp
            </a>
          </div>

          {/* Trust pills */}
          <div className="trust-strip">
            <span className="trust-pill">✓ Genuine Handlooms</span>
            <span className="trust-pill">✓ 500+ Happy Customers</span>
            <span className="trust-pill">✓ Local Delivery</span>
          </div>
        </div>
      </section>

      {/* ── Categories ──────────────── */}
      {categories.length > 0 && (
        <section className="page-section page-section-cream">
          <div className="container">
            <span className="section-tag">Browse by type</span>
            <h2 className="section-title">Shop by Category</h2>
            <div className="section-divider" />
            <div className="cat-grid">
              {categories.map((cat) => (
                <Link key={cat.id} to={`/catalog?category=${cat.id}`} className="cat-card">
                  <span className="cat-name">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ────────── */}
      <section className="page-section">
        <div className="container">
          <span className="section-tag">Handpicked for you</span>
          <h2 className="section-title">Featured Collection</h2>
          <div className="section-divider" />
          {featuredLoading ? (
            <div className="product-grid">
              {Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : featured.length > 0 ? (
            <>
              <div className="product-grid">
                {featured.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              <div style={{ textAlign: "center", marginTop: "3rem" }}>
                <Link to="/catalog" className="btn-primary">View All Products</Link>
              </div>
            </>
          ) : (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "1.05rem", padding: "3rem 0" }}>
              New arrivals coming soon.{" "}
              <Link to="/contact" style={{ color: "var(--primary)" }}>Contact us</Link> to inquire.
            </p>
          )}
        </div>
      </section>

      {/* ── Why Us ──────────────────── */}
      <section className="page-section page-section-deep">
        <div className="container">
          <span className="section-tag">Our promise</span>
          <h2 className="section-title">Why Choose Us</h2>
          <div className="section-divider" />
          <div className="why-grid">
            {WHY_US.map((item) => (
              <div key={item.title} className="why-card">
                <div className="why-icon-wrap">{item.icon}</div>
                <h3 className="why-title">{item.title}</h3>
                <p className="why-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────── */}
      <section style={{ background: "linear-gradient(150deg, #0D0611 0%, #28092A 45%, #7B1D45 100%)", padding: "5.5rem 0" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <span style={{
            display: "block",
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "1.15rem",
            color: "var(--gold-light)",
            marginBottom: "1rem",
            letterSpacing: "0.04em",
          }}>
            Find your perfect saree today
          </span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            color: "#fff",
            marginBottom: "1rem",
            fontWeight: 700,
          }}>
            Ready to Drape in Elegance?
          </h2>
          <div style={{ width: 60, height: 1, background: "var(--gold)", margin: "0 auto 1.75rem", opacity: 0.6 }} />
          <p style={{
            color: "rgba(255,255,255,0.72)",
            marginBottom: "2.25rem",
            fontSize: "1rem",
            lineHeight: 1.7,
            maxWidth: 500,
            margin: "0 auto 2.25rem",
          }}>
            Message us on WhatsApp — we'll help you pick the perfect piece for any occasion.
          </p>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noreferrer"
            className="btn-gold"
          >
            Chat on WhatsApp
          </a>
        </div>
      </section>
    </>
  );
}
