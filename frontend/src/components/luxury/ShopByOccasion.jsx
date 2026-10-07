import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSilkReveal } from "../../hooks/useSilkReveal";
import { getCategories } from "../../api";
import { OCCASIONS } from "../../data/products";

// Match occasion name to the best-fitting backend category by partial name overlap
function matchCategory(occasionName, categories) {
  if (!categories.length) return null;
  const lower = occasionName.toLowerCase();
  // Score each category by how many words in its name appear in the occasion name
  let best = null;
  let bestScore = 0;
  for (const cat of categories) {
    const catWords = cat.name.toLowerCase().split(/\W+/).filter(Boolean);
    const score = catWords.filter((w) => w.length > 2 && lower.includes(w)).length;
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return bestScore > 0 ? best : null;
}

function OccasionCard({ occasion, categoryId, tall }) {
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
        src={occasion.image}
        alt={occasion.name}
        loading="lazy"
        className="occasion-img"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover",
          transition: "transform 0.65s cubic-bezier(0.4,0,0.2,1)",
        }}
      />
      {/* Dark gradient at bottom */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
      }} />
      <div style={{
        position: "absolute", bottom: "1.25rem", left: "1.35rem", right: "1.35rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif", color: "#fff",
          fontSize: tall ? "1.35rem" : "1.05rem", fontWeight: 600, letterSpacing: "-0.01em",
        }}>
          {occasion.name}
        </span>
        <span
          className="explore-pill"
          style={{
            background: "var(--gold)", color: "#0D0611",
            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", padding: "0.35rem 0.9rem", borderRadius: 9999,
            opacity: 0, transform: "translateY(8px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          Explore
        </span>
      </div>
    </Link>
  );
}

export default function ShopByOccasion() {
  const sectionRef = useSilkReveal(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{ background: "#FAFAF7", padding: "6rem 0 7rem" }}
      aria-labelledby="occasion-title"
    >
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

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "260px 260px", gap: "1rem" }}
          className="occasion-bento"
        >
          {OCCASIONS.map((o, i) => {
            const matched = matchCategory(o.name, categories);
            return (
              <OccasionCard
                key={o.id}
                occasion={o}
                categoryId={matched?.id ?? null}
                tall={i === 0}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
