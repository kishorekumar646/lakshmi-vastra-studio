import { useEffect } from "react";
import { X } from "lucide-react";

const SIZE_ROWS = [
  { size: "XS", bust: '32"', waist: '25"', hip: '35"', length: "52\"" },
  { size: "S",  bust: '34"', waist: '27"', hip: '37"', length: "52\"" },
  { size: "M",  bust: '36"', waist: '29"', hip: '39"', length: "53\"" },
  { size: "L",  bust: '38"', waist: '31"', hip: '41"', length: "53\"" },
  { size: "XL", bust: '40"', waist: '33"', hip: '43"', length: "54\"" },
  { size: "XXL",bust: '42"', waist: '35"', hip: '45"', length: "54\"" },
];

export default function SizeGuideModal({ open, onClose }) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && open) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(13,6,17,0.62)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Size Guide"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            padding: "2.5rem",
            width: "100%",
            maxWidth: 540,
            boxShadow: "0 36px 90px rgba(0,0,0,0.35)",
            opacity: open ? 1 : 0,
            transform: open ? "scale(1)" : "scale(0.92)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.75rem",
            }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#1A0E14",
              }}
            >
              Size Guide
            </h2>
            <button
              onClick={onClose}
              aria-label="Close size guide"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                width: 34,
                height: 34,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--border-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "none")
              }
            >
              <X size={18} />
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.87rem",
              }}
            >
              <thead>
                <tr>
                  {["Size", "Bust", "Waist", "Hip", "Length"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "0.6rem 0.85rem",
                        borderBottom: "2px solid var(--border)",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        fontSize: "0.7rem",
                        letterSpacing: "0.1em",
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SIZE_ROWS.map((row, i) => (
                  <tr
                    key={row.size}
                    style={{
                      background: i % 2 === 0 ? "#FAFAF7" : "#fff",
                    }}
                  >
                    {[row.size, row.bust, row.waist, row.hip, row.length].map(
                      (val, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "0.78rem 0.85rem",
                            color: j === 0 ? "#1A0E14" : "var(--text-muted)",
                            fontWeight: j === 0 ? 700 : 400,
                            borderBottom: "1px solid var(--border-light)",
                          }}
                        >
                          {val}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: "1.25rem",
              lineHeight: 1.6,
            }}
          >
            All measurements in inches. For custom sizing or Made to Measure,{" "}
            <a href="/contact" style={{ color: "var(--gold)", fontWeight: 600 }}>
              contact us
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
