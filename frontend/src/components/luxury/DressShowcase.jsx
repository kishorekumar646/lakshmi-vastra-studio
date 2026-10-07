import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/CartContext";
import toast from "react-hot-toast";
import { getProducts } from "../../api";

const BG_GRADIENTS = [
  "linear-gradient(150deg,#2A0612 0%,#6B0F30 60%,#7B1D45 100%)",
  "linear-gradient(150deg,#0D1A0D 0%,#1A4A1A 60%,#2D6B2D 100%)",
  "linear-gradient(150deg,#0D0D2A 0%,#1A1A4A 60%,#2D2D6B 100%)",
  "linear-gradient(150deg,#1A0D00 0%,#4A2A00 60%,#6B3A00 100%)",
];

const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL"];

const DEFAULT_COLORS = [
  ["#7B1D45", "#B8892A", "#FFFFFF"],
  ["#2D6B2D", "#B8892A", "#7B1D45"],
  ["#2D2D6B", "#D4A94A", "#F0E0B8"],
  ["#6B3A0A", "#B8892A", "#7B1D45"],
];

function makeFallbackSvg(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="700"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6B0F30;stop-opacity:1"/><stop offset="100%" style="stop-color:#1A0E14;stop-opacity:0.8"/></linearGradient></defs><rect width="500" height="700" fill="url(#g)"/><text x="250" y="334" font-family="Georgia,serif" font-size="20" text-anchor="middle" fill="#D4A94A">${name}</text><text x="250" y="368" font-family="Georgia,serif" font-size="13" text-anchor="middle" fill="rgba(255,255,255,0.55)">Lakshmi Vastra Studio</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function toShowcaseLook(product, i) {
  return {
    id: product.id,
    index: String(i + 1).padStart(2, "0"),
    name: product.name,
    fabric: product.category_name || "Luxury Ethnic Wear",
    price: `₹${Number(product.price).toLocaleString("en-IN")}`,
    bg: BG_GRADIENTS[i % BG_GRADIENTS.length],
    sizes: DEFAULT_SIZES,
    colors: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    image: product.image_url || makeFallbackSvg(product.name),
  };
}

function transitionImages(imageRefs, fromIdx, toIdx) {
  const outEl = imageRefs.current[fromIdx];
  const inEl = imageRefs.current[toIdx];

  if (outEl) {
    outEl.style.transition = "opacity 0.55s ease, transform 0.55s ease, filter 0.55s ease";
    outEl.style.opacity = "0";
    outEl.style.transform = "translate(-50%, -50%) translateX(-70px) scale(0.93)";
    outEl.style.filter = "blur(9px)";
    outEl.style.zIndex = "1";
  }

  if (inEl) {
    inEl.style.transition = "none";
    inEl.style.transform = "translate(-50%, -50%) translateX(70px) scale(0.85) rotateY(9deg)";
    inEl.style.filter = "blur(7px)";
    inEl.style.opacity = "0";
    inEl.style.zIndex = "2";

    inEl.offsetHeight; // eslint-disable-line no-unused-expressions
    inEl.style.transition = "opacity 0.7s ease, transform 0.7s ease, filter 0.7s ease";
    inEl.style.transform = "translate(-50%, -50%)";
    inEl.style.filter = "blur(0px)";
    inEl.style.opacity = "1";
  }
}

export default function DressShowcase() {
  const wrapperRef = useRef(null);
  const imageRefs = useRef([]);
  const [activeLook, setActiveLook] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [looks, setLooks] = useState([]);
  const looksRef = useRef([]);
  const { addItem } = useCart();
  const prevLookRef = useRef(0);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fetch real products
  useEffect(() => {
    getProducts()
      .then((r) => {
        const products = (r.data || []).slice(0, 4);
        if (products.length === 0) return;
        const mapped = products.map(toShowcaseLook);
        looksRef.current = mapped;
        setLooks(mapped);
        // Reset look index when products load
        setActiveLook(0);
        prevLookRef.current = 0;
      })
      .catch(() => {});
  }, []);

  // Keep ref in sync with state for scroll handler
  useEffect(() => {
    looksRef.current = looks;
  }, [looks]);

  useEffect(() => {
    if (prefersReduced) return;

    const handleScroll = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const total = looksRef.current.length;
      if (total === 0) return;

      const rect = wrapper.getBoundingClientRect();
      const scrolledInto = -rect.top;
      const scrollable = wrapper.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, scrolledInto / scrollable));
      const newIdx = Math.min(Math.floor(progress * total), total - 1);

      if (newIdx !== prevLookRef.current) {
        transitionImages(imageRefs, prevLookRef.current, newIdx);
        prevLookRef.current = newIdx;
        setActiveLook(newIdx);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prefersReduced]);

  if (looks.length === 0) return null;

  const look = looks[activeLook] || looks[0];

  const handleAddToBag = async () => {
    try {
      await addItem({
        id: `showcase-${look.id}`,
        name: look.name,
        price: parseInt(look.price.replace(/[^\d]/g, ""), 10),
        image_url: look.image,
        category_name: look.fabric,
      });
      toast.success(`"${look.name}" added to bag`);
    } catch {
      toast.error("Failed to add to bag");
    }
  };

  if (prefersReduced) {
    return (
      <section style={{ background: looks[0].bg, padding: "5rem 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "center" }}>
          <img src={looks[0].image} alt={looks[0].name} style={{ width: "100%", maxWidth: 380, borderRadius: 16, display: "block", margin: "0 auto" }} />
          <ShowcaseInfo look={looks[0]} selectedSize={selectedSize} setSelectedSize={setSelectedSize} onAdd={handleAddToBag} activeLook={0} total={looks.length} />
        </div>
      </section>
    );
  }

  return (
    <div ref={wrapperRef} style={{ height: "500vh", position: "relative" }}>
      <div
        style={{
          position: "sticky", top: 0, height: "100vh",
          display: "flex", overflow: "hidden",
          background: look.bg, transition: "background 0.9s ease",
        }}
      >
        {/* Left: stacked images */}
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {looks.map((l, i) => (
            <img
              key={l.id}
              ref={(el) => (imageRefs.current[i] = el)}
              src={l.image}
              alt={l.name}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: i === 0 ? "translate(-50%, -50%)" : "translate(-50%, -50%) translateX(70px) scale(0.85) rotateY(9deg)",
                width: "min(360px, 48vw)",
                borderRadius: 18,
                objectFit: "cover",
                opacity: i === 0 ? 1 : 0,
                zIndex: i === 0 ? 2 : 1,
                boxShadow: "0 40px 90px rgba(0,0,0,0.55)",
                willChange: "transform, opacity, filter",
              }}
            />
          ))}
        </div>

        {/* Right: info panel */}
        <div style={{ width: "min(440px, 44vw)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "3rem 3rem 3rem 1.5rem", color: "#fff" }}>
          <ShowcaseInfo
            look={look}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            onAdd={handleAddToBag}
            activeLook={activeLook}
            total={looks.length}
          />
        </div>
      </div>
    </div>
  );
}

function ShowcaseInfo({ look, selectedSize, setSelectedSize, onAdd, activeLook, total }) {
  return (
    <>
      {/* Index + progress bar */}
      <div style={{ marginBottom: "2.25rem" }}>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "clamp(3rem, 7vw, 5.5rem)", fontWeight: 700, color: "rgba(255,255,255,0.1)", lineHeight: 1, letterSpacing: "-0.03em" }}>
          {look.index}
          <span style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.25)", verticalAlign: "super", marginLeft: "0.2em" }}>
            /{String(total).padStart(2, "0")}
          </span>
        </p>
        <div style={{ display: "flex", gap: 5, marginTop: "0.75rem" }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: i <= activeLook ? "var(--gold)" : "rgba(255,255,255,0.18)", borderRadius: 9999, transition: "background 0.5s" }} />
          ))}
        </div>
      </div>

      {/* Name */}
      <div style={{ overflow: "hidden", marginBottom: "0.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)", fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>
          {look.name}
        </h2>
      </div>

      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1rem", color: "rgba(255,255,255,0.55)", marginBottom: "0.9rem" }}>
        {look.fabric}
      </p>

      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "var(--gold-light)", fontWeight: 600, marginBottom: "1.75rem" }}>
        {look.price}
      </p>

      {/* Size pills */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.55rem" }}>Size</p>
        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
          {look.sizes.map((s) => (
            <button key={s} onClick={() => setSelectedSize(s)} style={{ padding: "0.32rem 0.7rem", borderRadius: 9999, border: selectedSize === s ? "1.5px solid var(--gold)" : "1.5px solid rgba(255,255,255,0.2)", background: selectedSize === s ? "var(--gold)" : "transparent", color: selectedSize === s ? "#0D0611" : "rgba(255,255,255,0.65)", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", transition: "all 0.18s" }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Colour swatches */}
      <div style={{ marginBottom: "2.25rem" }}>
        <p style={{ fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.55rem" }}>Colour</p>
        <div style={{ display: "flex", gap: "0.55rem" }}>
          {look.colors.map((c, i) => (
            <button key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: i === 0 ? "2px solid var(--gold)" : "2px solid rgba(255,255,255,0.18)", cursor: "pointer", padding: 0 }} aria-label={`Colour option ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Add to Bag */}
      <button
        onClick={onAdd}
        style={{ padding: "1rem 2rem", borderRadius: 9999, background: "#fff", color: "#0D0611", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", border: "none", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", boxShadow: "0 4px 20px rgba(255,255,255,0.15)" }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(255,255,255,0.28)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,255,255,0.15)"; }}
      >
        Add to Bag
      </button>
    </>
  );
}
