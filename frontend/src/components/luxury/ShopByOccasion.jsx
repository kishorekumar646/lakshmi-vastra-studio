import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSilkReveal } from "../../hooks/useSilkReveal";
import { getCategories, getProducts } from "../../api";

const FALLBACK_GRADIENTS = [
  ["#6B0F30", "#1A0E14"],
  ["#1A1A4A", "#0D0611"],
  ["#1E5C3A", "#0A2218"],
  ["#4A2A00", "#1A0D00"],
];

function makeFallbackSvg(name, i) {
  const [c1, c2] = FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:${c1};stop-opacity:1"/><stop offset="100%" style="stop-color:${c2};stop-opacity:1"/></linearGradient></defs><rect width="400" height="600" fill="url(#g)"/><text x="200" y="294" font-family="Georgia,serif" font-size="18" text-anchor="middle" fill="#D4A94A">${name}</text><text x="200" y="324" font-family="Georgia,serif" font-size="12" text-anchor="middle" fill="rgba(255,255,255,0.5)">Lakshmi Vastra Studio</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function OccasionCard({ name, image, categoryId, tall }) {
  const to = categoryId ? `/shop?category=${categoryId}` : "/shop";

  return (
    <Link
      to={to}
      className="occasion-card"
      style={{
        position: "relative", display: "block", borderRadius: 16, overflow: "hidden",
        gridRow: tall ? "1 / 3" : "auto",
        minHeight: tall ? "100%" : 260,
        cursor: "pointer", textDecoration: "none",
      }}
    >
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="occasion-img"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
          transition: "transform 0.65s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)" }} />
      <div style={{ position: "absolute", bottom: "1.25rem", left: "1.35rem", right: "1.35rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'Playfair Display', serif", color: "#fff", fontSize: tall ? "1.35rem" : "1.05rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
          {name}
        </span>
        <span
          className="explore-pill"
          style={{ background: "var(--gold)", color: "#0D0611", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", padding: "0.35rem 0.9rem", borderRadius: 9999, opacity: 0, transform: "translateY(8px)", transition: "opacity 0.3s ease, transform 0.3s ease" }}
        >
          Explore
        </span>
      </div>
    </Link>
  );
}

export default function ShopByOccasion() {
  const sectionRef = useSilkReveal(false);
  const [occasions, setOccasions] = useState([]);

  useEffect(() => {
    Promise.all([getCategories(), getProducts()])
      .then(([catRes, prodRes]) => {
        const categories = (catRes.data || []).slice(0, 4);
        const products = prodRes.data || [];

        const items = categories.map((cat, i) => {
          // Find any product in this category that has a real image
          const match = products.find(
            (p) =>
              p.category_name?.toLowerCase() === cat.name?.toLowerCase() &&
              p.image_url
          );
          return {
            id: cat.id,
            name: cat.name,
            categoryId: cat.id,
            image: match?.image_url || makeFallbackSvg(cat.name, i),
          };
        });

        if (items.length > 0) setOccasions(items);
      })
      .catch(() => {});
  }, []);

  if (occasions.length === 0) return null;

  return (
    <section ref={sectionRef} style={{ background: "#FAFAF7", padding: "6rem 0 7rem" }} aria-labelledby="occasion-title">
      <style>{`
        .occasion-card:hover .occasion-img { transform: scale(1.07); }
        .occasion-card:hover .explore-pill { opacity: 1 !important; transform: translateY(0) !important; }
      `}</style>

      <div className="container">
        <p style={{ fontSize: "0.68rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "0.7rem" }}>
          Curated for You
        </p>
        <h2 id="occasion-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 700, color: "#1A0E14", marginBottom: "3.5rem" }}>
          Shop by Occasion
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "260px 260px", gap: "1rem" }} className="occasion-bento">
          {occasions.map((o, i) => (
            <OccasionCard
              key={o.id}
              name={o.name}
              image={o.image}
              categoryId={o.categoryId}
              tall={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
