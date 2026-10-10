import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useSilkReveal } from "../../hooks/useSilkReveal";
import { getProducts } from "../../api";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import toast from "react-hot-toast";

function ArrivalCard({ product }) {
  const [hovered, setHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);

  const handleAddToBag = async (e) => {
    e.stopPropagation();
    if (adding || added) return;
    setAdding(true);
    try {
      await addItem(product, 1);
      setAdded(true);
      toast.success(`"${product.name}" added to cart`);
      setTimeout(() => setAdded(false), 2500);
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const isNew = product.created_at &&
    (Date.now() - new Date(product.created_at).getTime()) < 14 * 86400000;

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: "#fff" }}
    >
      {/* Image container — 3:4 aspect ratio */}
      <div style={{ position: "relative", paddingBottom: "133.33%", background: "#F0E8E0", overflow: "hidden", borderRadius: "14px 14px 0 0" }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              transition: "transform 0.65s cubic-bezier(0.4,0,0.2,1)",
              transform: hovered ? "scale(1.07)" : "scale(1)",
            }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(150deg, #0D0611 0%, #28092A 50%, #7B1D45 100%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "0.5rem",
          }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(0.8rem, 2vw, 1rem)",
              fontWeight: 600, color: "rgba(255,255,255,0.85)",
              textAlign: "center", padding: "0 1rem", lineHeight: 1.4,
            }}>{product.name}</span>
            <span style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: "italic", fontSize: "0.8rem",
              color: "var(--gold-light, #D4A94A)",
              letterSpacing: "0.06em",
            }}>
              ₹{product.price?.toLocaleString("en-IN")}
            </span>
          </div>
        )}

        {/* NEW pill */}
        {isNew && (
          <span style={{
            position: "absolute", top: "0.75rem", left: "0.75rem",
            background: "var(--gold)", color: "#fff",
            fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.18em",
            textTransform: "uppercase", padding: "0.25rem 0.65rem",
            borderRadius: 9999, zIndex: 2,
          }}>NEW</span>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.stopPropagation(); toggle(product.id); }}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          style={{
            position: "absolute", top: "0.75rem", right: "0.75rem",
            background: "rgba(255,255,255,0.88)", border: "none", borderRadius: "50%",
            width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", backdropFilter: "blur(6px)", zIndex: 2, transition: "transform 0.18s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
        >
          <Heart size={15} fill={wishlisted ? "var(--primary)" : "none"} color={wishlisted ? "var(--primary)" : "#1A0E14"} />
        </button>

        {/* Slide-up Add to Bag bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: added ? "#1a7a4a" : "#1A0E14",
          padding: "0.9rem 1rem", textAlign: "center",
          transform: hovered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.32s cubic-bezier(0.4,0,0.2,1), background 0.3s",
          zIndex: 3,
        }}>
          <button
            onClick={handleAddToBag}
            disabled={adding}
            style={{
              width: "100%", background: "none", border: "none",
              color: "#fff", fontSize: "0.75rem", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              cursor: adding ? "wait" : "pointer",
              opacity: adding ? 0.7 : 1,
            }}
          >
            {added ? "✓ Added!" : adding ? "Adding…" : "Add to Bag"}
          </button>
        </div>
      </div>

      {/* Card info */}
      <div style={{ padding: "0.9rem 0.5rem 1rem" }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.93rem", fontWeight: 600, color: "#1A0E14", marginBottom: "0.3rem" }}>
          {product.name}
        </p>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "baseline" }}>
          <span style={{ fontWeight: 700, color: "#1A0E14", fontSize: "0.88rem" }}>
            ₹{product.price.toLocaleString("en-IN")}
          </span>
          {product.category_name && (
            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {product.category_name}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function NewArrivals() {
  const gridRef = useSilkReveal(true);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts()
      .then((r) => {
        const latest = [...r.data]
          .filter((p) => !p.is_featured)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 4);
        setProducts(latest);
      })
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <section style={{ background: "#FDF5F0", padding: "6rem 0 7rem" }} aria-labelledby="new-arrivals-title">
      <div className="container">
        <p style={{ fontSize: "0.68rem", letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--gold)", fontWeight: 700, marginBottom: "0.7rem" }}>
          Just In
        </p>
        <h2 id="new-arrivals-title" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4vw, 3rem)", fontWeight: 700, color: "#1A0E14", marginBottom: "3.5rem" }}>
          New Arrivals
        </h2>

        <div
          ref={gridRef}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem" }}
          className="arrivals-grid"
        >
          {products.map((p) => (
            <ArrivalCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
