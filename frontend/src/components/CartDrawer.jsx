import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartDrawer({ open, onClose }) {
  const { items, cartTotal, removeItem, updateItem } = useCart();

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
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
          transition: "opacity 0.35s ease",
        }}
      />

      {/* Drawer panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping Bag"
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: "min(480px, 100vw)",
          background: "#fff",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-20px 0 70px rgba(0,0,0,0.28)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
          willChange: "transform",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.5rem 1.75rem",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <ShoppingBag size={20} color="var(--primary)" />
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#1A0E14",
              }}
            >
              Your Bag
              {items.length > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--primary)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    marginLeft: "0.5rem",
                    verticalAlign: "middle",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {items.length}
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              borderRadius: "50%",
              width: 36,
              height: 36,
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
            <X size={20} />
          </button>
        </div>

        {/* Item list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.25rem 1.75rem",
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "5rem 0",
                color: "var(--text-muted)",
              }}
            >
              <ShoppingBag
                size={44}
                strokeWidth={1}
                style={{ marginBottom: "1.25rem", opacity: 0.3 }}
              />
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "1.1rem",
                }}
              >
                Your bag is empty
              </p>
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "1.35rem",
              }}
            >
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    paddingBottom: "1.35rem",
                    borderBottom: "1px solid var(--border-light)",
                  }}
                >
                  <img
                    src={
                      item.image_url ||
                      `data:image/svg+xml,${encodeURIComponent(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="96"><rect width="72" height="96" fill="#F0E8E0"/><text x="36" y="52" font-family="serif" font-size="10" text-anchor="middle" fill="#7B1D45">LV</text></svg>'
                      )}`
                    }
                    alt={item.name}
                    style={{
                      width: 72,
                      height: 96,
                      objectFit: "cover",
                      borderRadius: 8,
                      flexShrink: 0,
                      background: "var(--border-light)",
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginBottom: "0.25rem",
                        color: "#1A0E14",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      style={{
                        color: "var(--gold)",
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        marginBottom: "0.85rem",
                      }}
                    >
                      ₹{Number(item.price).toLocaleString("en-IN")}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Qty stepper */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: "1.5px solid var(--border)",
                          borderRadius: 9999,
                          overflow: "hidden",
                        }}
                      >
                        <button
                          onClick={() =>
                            updateItem(item.id, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.35rem 0.65rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--border-light)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          <Minus size={13} />
                        </button>
                        <span
                          style={{
                            minWidth: 22,
                            textAlign: "center",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            color: "#1A0E14",
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateItem(item.id, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.35rem 0.65rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                              "var(--border-light)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background = "none")
                          }
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          fontSize: "0.76rem",
                          textDecoration: "underline",
                          textUnderlineOffset: 2,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer checkout */}
        {items.length > 0 && (
          <div
            style={{
              padding: "1.5rem 1.75rem",
              borderTop: "1px solid var(--border-light)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "1.25rem",
              }}
            >
              <span
                style={{ fontSize: "0.84rem", color: "var(--text-muted)" }}
              >
                Subtotal
              </span>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#1A0E14",
                }}
              >
                ₹{cartTotal.toLocaleString("en-IN")}
              </span>
            </div>
            <Link
              to="/checkout"
              onClick={onClose}
              style={{
                display: "block",
                textAlign: "center",
                padding: "1.05rem",
                borderRadius: 9999,
                background: "var(--gold)",
                color: "#0D0611",
                fontWeight: 700,
                fontSize: "0.87rem",
                letterSpacing: "0.09em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "transform 0.18s, box-shadow 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 28px rgba(184,137,42,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
