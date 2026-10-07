import { useEffect, useRef } from "react";

const COPY_WORDS =
  "Every saree we create is a labour of love — woven by skilled artisans using centuries-old techniques, finished by hand, and delivered as a masterpiece."
    .split(" ");

const COUNTERS = [
  { label: "hrs of handwork", suffix: "+", target: 120 },
  { label: "pure fabrics", suffix: "%", target: 100 },
  { label: "Made to Measure", suffix: "", target: null },
];

export default function FabricCraft() {
  const sectionRef = useRef(null);
  const wordRefs = useRef([]);
  const counterRefs = useRef([]);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;

    const words = wordRefs.current.filter(Boolean);

    words.forEach((w) => {
      w.style.opacity = "0";
      w.style.transform = "translateY(14px)";
      w.style.transition = "opacity 0.38s ease, transform 0.38s ease";
    });

    let countersStarted = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;

        // Word stagger
        words.forEach((w, i) => {
          setTimeout(() => {
            w.style.opacity = "1";
            w.style.transform = "none";
          }, i * 38);
        });

        // Counters (run once)
        if (!countersStarted) {
          countersStarted = true;
          COUNTERS.forEach((c, i) => {
            if (c.target === null) return;
            const el = counterRefs.current[i];
            if (!el) return;
            let val = 0;
            const step = c.target / 72;
            const iv = setInterval(() => {
              val += step;
              if (val >= c.target) {
                val = c.target;
                clearInterval(iv);
              }
              el.textContent = Math.floor(val) + c.suffix;
            }, 1000 / 72);
          });
        }

        observer.disconnect();
      },
      { threshold: 0.22 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [prefersReduced]);

  return (
    <section
      ref={sectionRef}
      className="fabric-section"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "90vh" }}
      aria-labelledby="fabric-title"
    >
      <style>{`
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0,0); }
          50% { transform: scale(1.1) translate(-2%,1%); }
          100% { transform: scale(1.05) translate(1%,-2%); }
        }
        @media (max-width: 767px) {
          .fabric-section { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Left: Ken-Burns image */}
      <div style={{ position: "relative", overflow: "hidden", minHeight: "50vh" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, #3A1020 0%, #7B1D45 40%, #B8892A 100%)",
            animation: prefersReduced
              ? "none"
              : "kenBurns 12s ease-in-out infinite alternate",
            willChange: "transform",
          }}
        />
        {/* Silk texture overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><defs><pattern id="silk" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><line x1="0" y1="10" x2="20" y2="10" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/><line x1="10" y1="0" x2="10" y2="20" stroke="rgba(255,255,255,0.04)" stroke-width="0.5"/></pattern></defs><rect width="120" height="120" fill="url(#silk)"/></svg>'
            )}")`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontStyle: "italic",
              fontSize: "clamp(1.5rem, 4vw, 3rem)",
              color: "rgba(255,255,255,0.18)",
              textAlign: "center",
              padding: "0 2rem",
              lineHeight: 1.3,
              userSelect: "none",
            }}
          >
            Silk &amp; Zari
            <br />
            Craft
          </p>
        </div>
      </div>

      {/* Right: Copy + counters */}
      <div
        style={{
          background: "#FAFAF7",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "5rem 4rem 5rem 3.5rem",
        }}
      >
        <p
          style={{
            fontSize: "0.68rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "var(--gold)",
            fontWeight: 700,
            marginBottom: "1.25rem",
          }}
        >
          Fabric &amp; Craft
        </p>
        <h2
          id="fabric-title"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)",
            fontWeight: 700,
            color: "#1A0E14",
            marginBottom: "2rem",
            lineHeight: 1.15,
          }}
        >
          Made with Devotion
        </h2>

        {/* Word-stagger paragraph */}
        <p
          style={{
            fontSize: "1.05rem",
            lineHeight: 1.95,
            color: "var(--text-muted)",
            marginBottom: "3.5rem",
            maxWidth: 420,
          }}
        >
          {COPY_WORDS.map((word, i) => (
            <span
              key={i}
              ref={(el) => (wordRefs.current[i] = el)}
              style={{
                display: "inline-block",
                marginRight: "0.3em",
                opacity: prefersReduced ? 1 : 0,
              }}
            >
              {word}
            </span>
          ))}
        </p>

        {/* Animated counters */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
          }}
        >
          {COUNTERS.map((c, i) => (
            <div key={i}>
              <p
                ref={(el) => (counterRefs.current[i] = el)}
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                  fontWeight: 700,
                  color: "var(--gold)",
                  lineHeight: 1,
                }}
              >
                {c.target !== null ? `0${c.suffix}` : "✦"}
              </p>
              <p
                style={{
                  fontSize: "0.76rem",
                  color: "var(--text-muted)",
                  marginTop: "0.3rem",
                  lineHeight: 1.45,
                }}
              >
                {c.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
