import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts } from "../api";
import StarRating from "./StarRating";

export default function RelatedProducts({ categoryId, excludeId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!categoryId) return;
    getProducts({ category_id: categoryId })
      .then((r) => setItems(r.data.filter((p) => p.id !== excludeId).slice(0, 4)))
      .catch(() => {});
  }, [categoryId, excludeId]);

  if (!items.length) return null;

  return (
    <section style={{ padding: "3rem 0 4rem", background: "#fff", borderTop: "1px solid var(--border-light)" }}>
      <div className="container">
        <span className="section-tag">More like this</span>
        <h2 className="section-title" style={{ fontSize: "clamp(1.4rem,4vw,1.9rem)", marginBottom: "0.5rem" }}>
          You May Also Like
        </h2>
        <div className="section-divider" style={{ marginBottom: "2rem" }} />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: "1.25rem",
        }}>
          {items.map((p) => (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div style={{
                background: "var(--cream)",
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid var(--border-light)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{ height: 200, background: "var(--cream-deep)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontSize: "0.8rem" }}>
                    No Image
                  </div>
                )}
                <div style={{ padding: "0.85rem" }}>
                  <p style={{ fontSize: "0.7rem", color: "var(--gold)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                    {p.category_name}
                  </p>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600, fontSize: "0.95rem", color: "var(--text)", marginBottom: "0.35rem", lineHeight: 1.3 }}>
                    {p.name}
                  </p>
                  <p style={{ fontWeight: 700, color: "var(--primary)", fontSize: "1rem" }}>
                    ₹{p.price.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
