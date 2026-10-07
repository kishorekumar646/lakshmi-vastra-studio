import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/CartContext";
import { SHOWCASE_LOOKS } from "../../data/products";
import toast from "react-hot-toast";

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

    // Force reflow then animate in
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
  const { addItem } = useCart();
  const prevLookRef = useRef(0);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;

    const handleScroll = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const scrolledInto = -rect.top; // px scrolled past wrapper top
      const scrollable = wrapper.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const progress = Math.max(0, Math.min(1, scrolledInto / scrollable));
      const newIdx = Math.min(
        Math.floor(progress * SHOWCASE_LOOKS.length),
        SHOWCASE_LOOKS.length - 1
      );

      if (newIdx !== prevLookRef.current) {
        transitionImages(imageRefs, prevLookRef.current, newIdx);
        prevLookRef.current = newIdx;
        setActiveLook(newIdx);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [prefersReduced]);

  const look = SHOWCASE_LOOKS[activeLook];

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
      <section style={{ background: SHOWCASE_LOOKS[0].bg, padding: "5rem 0" }}>
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4rem",
            alignItems: "center",
          }}
        >
          <img
            src={SHOWCASE_LOOKS[0].image}
            alt={SHOWCASE_LOOKS[0].name}
            style={{ width: "100%", maxWidth: 380, borderRadius: 16, display: "block", margin: "0 auto" }}
          />
          <ShowcaseInfo look={SHOWCASE_LOOKS[0]} selectedSize={selectedSize} setSelectedSize={setSelectedSize} onAdd={handleAddToBag} activeLook={0} />
        </div>
      </section>
    );
  }

  return (
    <div ref={wrapperRef} style={{ height: "500vh", position: "relative" }}>
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          display: "flex",
          overflow: "hidden",
          background: look.bg,
          transition: "background 0.9s ease",
        }}
      >
        {/* Left: stacked images */}
        <div
          style={{
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {SHOWCASE_LOOKS.map((l, i) => (
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
        <div
          style={{
            width: "min(440px, 44vw)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "3rem 3rem 3rem 1.5rem",
            color: "#fff",
          }}
        >
          <ShowcaseInfo
            look={look}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            onAdd={handleAddToBag}
            activeLook={activeLook}
          />
        </div>
      </div>
    </div>
  );
}

function ShowcaseInfo({ look, selectedSize, setSelectedSize, onAdd, activeLook }) {
  return (
    <>
      {/* Index + progress bar */}
      <div style={{ marginBottom: "2.25rem" }}>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(3rem, 7vw, 5.5rem)",
            fontWeight: 700,
            color: "rgba(255,255,255,0.1)",
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {look.index}
          <span
            style={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.25)",
              verticalAlign: "super",
              marginLeft: "0.2em",
            }}
          >
            /{String(SHOWCASE_LOOKS.length).padStart(2, "0")}
          </span>
        </p>
        {/* Segmented progress */}
        <div style={{ display: "flex", gap: 5, marginTop: "0.75rem" }}>
          {SHOWCASE_LOOKS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 2,
                background:
                  i <= activeLook
                    ? "var(--gold)"
                    : "rgba(255,255,255,0.18)",
                borderRadius: 9999,
                transition: "background 0.5s",
              }}
            />
          ))}
        </div>
      </div>

      {/* Name */}
      <div style={{ overflow: "hidden", marginBottom: "0.5rem" }}>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.6rem, 3.5vw, 2.6rem)",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.1,
          }}
        >
          {look.name}
        </h2>
      </div>

      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: "italic",
          fontSize: "1rem",
          color: "rgba(255,255,255,0.55)",
          marginBottom: "0.9rem",
        }}
      >
        {look.fabric}
      </p>

      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.8rem",
          color: "var(--gold-light)",
          fontWeight: 600,
          marginBottom: "1.75rem",
        }}
      >
        {look.price}
      </p>

      {/* Size pills */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            fontSize: "0.68rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "0.55rem",
          }}
        >
          Size
        </p>
        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
          {look.sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSize(s)}
              style={{
                padding: "0.32rem 0.7rem",
                borderRadius: 9999,
                border:
                  selectedSize === s
                    ? "1.5px solid var(--gold)"
                    : "1.5px solid rgba(255,255,255,0.2)",
                background: selectedSize === s ? "var(--gold)" : "transparent",
                color:
                  selectedSize === s ? "#0D0611" : "rgba(255,255,255,0.65)",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.18s",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Color swatches */}
      <div style={{ marginBottom: "2.25rem" }}>
        <p
          style={{
            fontSize: "0.68rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "0.55rem",
          }}
        >
          Colour
        </p>
        <div style={{ display: "flex", gap: "0.55rem" }}>
          {look.colors.map((c, i) => (
            <button
              key={i}
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: c,
                border:
                  i === 0
                    ? "2px solid var(--gold)"
                    : "2px solid rgba(255,255,255,0.18)",
                cursor: "pointer",
                padding: 0,
              }}
              aria-label={`Colour option ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Add to Bag */}
      <button
        onClick={onAdd}
        style={{
          padding: "1rem 2rem",
          borderRadius: 9999,
          background: "#fff",
          color: "#0D0611",
          fontWeight: 700,
          fontSize: "0.82rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          border: "none",
          cursor: "pointer",
          transition: "transform 0.2s, box-shadow 0.2s",
          boxShadow: "0 4px 20px rgba(255,255,255,0.15)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 10px 32px rgba(255,255,255,0.28)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,255,255,0.15)";
        }}
      >
        Add to Bag
      </button>
    </>
  );
}
