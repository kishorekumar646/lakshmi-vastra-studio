import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, Share2 } from "lucide-react";

const NAV_COLS = {
  Shop: [
    { label: "All Sarees", to: "/shop" },
    { label: "New Arrivals", to: "/shop" },
    { label: "Bridal Collection", to: "/catalog" },
    { label: "Festive Ethnic", to: "/catalog" },
  ],
  Help: [
    { label: "Size Guide", to: "/help" },
    { label: "Shipping & Returns", to: "/help" },
    { label: "Help Center", to: "/help" },
    { label: "Contact Us", to: "/contact" },
  ],
  Company: [
    { label: "About Us", to: "/about" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Terms of Use", to: "/terms" },
    { label: "WhatsApp", to: "/contact" },
  ],
};

export default function NewsletterFooter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) setDone(true);
  };

  return (
    <footer
      style={{
        background: "#0D0611",
        position: "relative",
        overflow: "hidden",
        paddingTop: "6.5rem",
        paddingBottom: "3.5rem",
      }}
    >
      {/* Faded background wordmark */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(4.5rem, 16vw, 15rem)",
          fontWeight: 700,
          color: "rgba(255,255,255,0.025)",
          whiteSpace: "nowrap",
          userSelect: "none",
          pointerEvents: "none",
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        LAKSHMI VASTRA
      </div>

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        {/* Newsletter floating card */}
        <div
          style={{
            background: "#F5F0E8",
            borderRadius: 22,
            padding: "3.25rem 3rem",
            maxWidth: 600,
            margin: "0 auto 5.5rem",
            textAlign: "center",
            boxShadow: "0 36px 90px rgba(0,0,0,0.45)",
          }}
        >
          <p
            style={{
              fontSize: "0.68rem",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "var(--gold)",
              fontWeight: 700,
              marginBottom: "0.7rem",
            }}
          >
            Exclusive Offer
          </p>
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 700,
              color: "#1A0E14",
              marginBottom: "0.7rem",
              lineHeight: 1.2,
            }}
          >
            Get 10% Off Your First Saree
          </h3>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.9rem",
              marginBottom: "1.75rem",
            }}
          >
            Join our community of 500+ happy customers.
          </p>

          {done ? (
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "var(--gold)",
                fontWeight: 600,
                fontSize: "1.05rem",
              }}
            >
              ✓ Welcome! Your 10% code is on its way.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  flex: "1 1 210px",
                  padding: "0.9rem 1.3rem",
                  borderRadius: 9999,
                  border: "1.5px solid var(--border)",
                  background: "#fff",
                  fontSize: "0.9rem",
                  color: "#1A0E14",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                style={{
                  padding: "0.9rem 2.1rem",
                  borderRadius: 9999,
                  background: "var(--gold)",
                  color: "#0D0611",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  border: "none",
                  cursor: "pointer",
                  transition: "transform 0.18s, box-shadow 0.18s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(184,137,42,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "";
                  e.currentTarget.style.boxShadow = "";
                }}
              >
                Subscribe
              </button>
            </form>
          )}
        </div>

        {/* Link columns + brand */}
        <div
          className="footer-cols"
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr",
            gap: "2.5rem 3rem",
            marginBottom: "4rem",
          }}
        >
          {/* Brand column */}
          <div>
            <h4
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: "1.2rem",
                fontWeight: 700,
                marginBottom: "1rem",
              }}
            >
              Lakshmi Vastra Studio
            </h4>
            <p
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: "0.84rem",
                lineHeight: 1.75,
                marginBottom: "1.25rem",
              }}
            >
              Exquisite sarees &amp; ethnic wear — tradition woven in every
              thread.
            </p>
            <div style={{ display: "flex", gap: "0.9rem" }}>
              {[
                { Icon: Globe, label: "Website" },
                { Icon: Share2, label: "Social" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  style={{
                    color: "rgba(255,255,255,0.38)",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--gold)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.38)")
                  }
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(NAV_COLS).map(([category, links]) => (
            <div key={category}>
              <h5
                style={{
                  color: "#fff",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "1.1rem",
                }}
              >
                {category}
              </h5>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {links.map((l) => (
                  <li key={l.label} style={{ marginBottom: "0.65rem" }}>
                    <Link
                      to={l.to}
                      style={{
                        color: "rgba(255,255,255,0.38)",
                        fontSize: "0.84rem",
                        textDecoration: "none",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--gold-light)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "rgba(255,255,255,0.38)")
                      }
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: "2rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p
            style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.78rem" }}
          >
            &copy; {new Date().getFullYear()} Lakshmi Vastra Studio. All rights
            reserved.
          </p>

          {/* Payment method badges */}
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            {["UPI", "Visa", "MC", "Razorpay"].map((p) => (
              <span
                key={p}
                style={{
                  color: "rgba(255,255,255,0.32)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  background: "rgba(255,255,255,0.06)",
                  padding: "0.28rem 0.58rem",
                  borderRadius: 4,
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .footer-cols {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .footer-cols {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
