import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      style={{
        position: "fixed",
        bottom: "5.5rem",   /* sits above the floating WhatsApp button */
        right: "1.25rem",
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: "var(--primary)",
        border: "none",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
        zIndex: 998,
        animation: "fadeIn 0.25s ease",
        transition: "opacity 0.2s",
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
    >
      <ChevronUp size={20} />
    </button>
  );
}
