import { useSilkReveal } from "../../hooks/useSilkReveal";
import { TESTIMONIALS_DATA } from "../../data/products";
import StarRating from "../StarRating";

export default function Testimonials() {
  const gridRef = useSilkReveal(true);

  return (
    <section
      style={{ background: "#FAFAF7", padding: "6rem 0 7rem" }}
      aria-labelledby="testimonials-title"
    >
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4.5rem" }}>
          {/* Stacked avatars */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "1.1rem",
            }}
          >
            {["P", "M", "A"].map((l, i) => (
              <div
                key={i}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  border: "2.5px solid #FAFAF7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.83rem",
                  marginLeft: i > 0 ? -9 : 0,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.14)",
                  zIndex: 3 - i,
                  position: "relative",
                }}
              >
                {l}
              </div>
            ))}
          </div>

          <p
            style={{
              fontSize: "0.76rem",
              color: "var(--gold)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              marginBottom: "0.6rem",
              textTransform: "uppercase",
            }}
          >
            4.9/5 &middot; 500+ Happy Customers
          </p>
          <h2
            id="testimonials-title"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.9rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#1A0E14",
            }}
          >
            Loved by Every Silhouette
          </h2>
        </div>

        {/* Cards */}
        <div
          ref={gridRef}
          className="testimonials-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {TESTIMONIALS_DATA.map((t, i) => (
            <blockquote
              key={t.id}
              style={{
                background: "#fff",
                borderRadius: 18,
                padding: "2.25rem",
                border: "1px solid var(--border-light)",
                boxShadow: "0 6px 28px rgba(0,0,0,0.055)",
                position: "relative",
                transform: i === 1 ? "translateY(2.25rem)" : "none",
                margin: 0,
              }}
            >
              {/* Decorative quotation mark */}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "1.1rem",
                  right: "1.75rem",
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "5.5rem",
                  color: "var(--gold)",
                  opacity: 0.1,
                  lineHeight: 1,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              >
                &ldquo;
              </span>

              <StarRating value={t.rating} size={15} />

              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "1.05rem",
                  lineHeight: 1.78,
                  color: "var(--text)",
                  margin: "1.1rem 0 1.5rem",
                }}
              >
                &ldquo;{t.text}&rdquo;
              </p>

              <footer
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {t.avatar}
                </div>
                <div>
                  <cite
                    style={{
                      fontStyle: "normal",
                      fontWeight: 700,
                      fontSize: "0.87rem",
                      color: "#1A0E14",
                      display: "block",
                    }}
                  >
                    {t.name}
                  </cite>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--gold)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {t.product}
                  </span>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .testimonials-grid {
            grid-template-columns: 1fr !important;
          }
          .testimonials-grid blockquote {
            transform: none !important;
          }
        }
      `}</style>
    </section>
  );
}
