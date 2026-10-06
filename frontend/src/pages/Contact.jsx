import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { submitInquiry, WHATSAPP_NUMBER, PHONE_NUMBER } from "../api";
import toast from "react-hot-toast";
import { Phone, MessageCircle, MapPin, Clock, Send, ArrowRight } from "lucide-react";
import { stripPhone, phoneError } from "../utils/phone";

/* ── Scroll-in animation hook ── */
function useVisible(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function FadeIn({ children, delay = 0, style = {} }) {
  const [ref, visible] = useVisible();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

const WA_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = "Contact Us | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const pErr = phoneError(form.phone, true);
    if (pErr) { toast.error(pErr); return; }
    setSubmitting(true);
    try {
      await submitInquiry(form);
      setSent(true);
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch {
      toast.error("Failed to send. Please try WhatsApp instead.");
    } finally {
      setSubmitting(false);
    }
  };

  const waMsg = encodeURIComponent("Hello Lakshmi Vastra Studio! I'd like to know more about your saree collection.");

  const INFO_CARDS = [
    {
      icon: <Phone size={22} />,
      label: "Call Us",
      value: PHONE_NUMBER,
      href: `tel:${PHONE_NUMBER}`,
      linkText: PHONE_NUMBER,
    },
    {
      icon: <MessageCircle size={22} />,
      label: "WhatsApp",
      value: "Fastest way to reach us",
      href: `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`,
      linkText: "Start a Chat →",
      external: true,
    },
    {
      icon: <MapPin size={22} />,
      label: "Store Address",
      value: "H No 15/653, Lakshmi Tailoring, Tholu Shopu Street, Near Water Tank, Gooty RS, Anantapur – 515402",
      href: "https://www.google.com/maps/search/?api=1&query=Gooty+RS+Anantapur+515402",
      linkText: "Get Directions →",
      external: true,
    },
    {
      icon: <Clock size={22} />,
      label: "Store Hours",
      value: "Mon – Sat: 10 am – 8 pm\nSunday: 11 am – 6 pm",
    },
  ];

  return (
    <div style={{ overflowX: "hidden" }}>

      {/* ── Hero ── */}
      <section style={{
        background: "linear-gradient(135deg, #1A0E14 0%, #3D1028 50%, #7B1D45 100%)",
        padding: "5rem 1.5rem 4.5rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative rings */}
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            position: "absolute", borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.05)",
            width: `${400 + i * 180}px`, height: `${400 + i * 180}px`,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }} />
        ))}

        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          <span style={{
            display: "inline-block", padding: "0.3rem 1rem", borderRadius: 20,
            background: "rgba(184,137,42,0.2)", border: "1px solid rgba(184,137,42,0.4)",
            color: "#D4A94A", fontSize: "0.78rem", fontWeight: 700,
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.25rem",
          }}>We're here to help</span>

          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: "#fff",
            margin: "0 0 1.25rem", lineHeight: 1.15,
          }}>
            Get in <span style={{ color: "#D4A94A" }}>Touch</span>
          </h1>

          <p style={{
            color: "rgba(255,255,255,0.72)", fontSize: "1.05rem",
            lineHeight: 1.75, margin: "0 0 2.5rem",
          }}>
            We'd love to hear from you. Whether it's a custom order, a question about a saree, or just a hello — our team responds quickly.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.6rem",
                padding: "0.8rem 1.6rem", borderRadius: 10,
                background: "#25D366", color: "#fff",
                fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                boxShadow: "0 4px 16px rgba(37,211,102,0.35)",
              }}
            >
              {WA_ICON} WhatsApp Us
            </a>
            <a
              href={`tel:${PHONE_NUMBER}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                padding: "0.8rem 1.6rem", borderRadius: 10,
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)",
                color: "#fff", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none",
              }}
            >
              <Phone size={16} /> {PHONE_NUMBER}
            </a>
          </div>
        </div>
      </section>

      {/* ── Info Cards ── */}
      <section style={{ background: "var(--cream-deep)", padding: "4rem 1.5rem" }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
          }}>
            {INFO_CARDS.map(({ icon, label, value, href, linkText, external }, i) => (
              <FadeIn key={label} delay={i * 0.08}>
                <div style={{
                  background: "#fff", borderRadius: 16, padding: "1.75rem",
                  border: "1px solid var(--border-light)",
                  boxShadow: "0 2px 16px rgba(123,29,69,0.06)",
                  height: "100%", boxSizing: "border-box",
                  display: "flex", flexDirection: "column", gap: "0.85rem",
                }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 14,
                    background: "linear-gradient(135deg, var(--cream-deep), var(--cream))",
                    border: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--primary)", flexShrink: 0,
                  }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{
                      margin: "0 0 0.35rem",
                      fontSize: "0.7rem", fontWeight: 700,
                      color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.1em",
                    }}>{label}</p>
                    <p style={{
                      margin: "0 0 0.5rem",
                      fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.6,
                      whiteSpace: "pre-line",
                    }}>{value}</p>
                    {href && (
                      <a
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.3rem",
                          fontSize: "0.82rem", fontWeight: 700,
                          color: "var(--primary)", textDecoration: "none",
                        }}
                      >
                        {linkText}
                      </a>
                    )}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + Info section ── */}
      <section style={{ padding: "5rem 1.5rem", background: "#fff" }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "4rem",
            alignItems: "start",
          }}>

            {/* Left: info panel */}
            <FadeIn>
              <span className="section-tag">Reach Out</span>
              <h2 className="section-title" style={{ marginBottom: "1rem" }}>
                We Reply Within a Few Hours
              </h2>
              <div className="section-divider" style={{ marginBottom: "1.5rem" }} />
              <p style={{ color: "var(--text-muted)", lineHeight: 1.85, marginBottom: "1.25rem" }}>
                Have a question about a saree? Looking for a specific weave, colour, or occasion-wear? We're happy to guide you to the perfect piece.
              </p>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.85, marginBottom: "2rem" }}>
                You can fill out the form or reach us directly on WhatsApp for the fastest response. Custom orders, bulk enquiries, and gifting requests are all welcome.
              </p>

              {/* Quick contact links */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: "0.85rem",
                    padding: "1rem 1.25rem", borderRadius: 12,
                    background: "#F0FDF4", border: "1px solid #BBF7D0",
                    textDecoration: "none", transition: "box-shadow 0.2s",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", flexShrink: 0,
                  }}>
                    {WA_ICON}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "#166534" }}>Chat on WhatsApp</p>
                    <p style={{ margin: 0, fontSize: "0.76rem", color: "#4B7A5B" }}>Usually replies in minutes</p>
                  </div>
                  <ArrowRight size={16} style={{ marginLeft: "auto", color: "#166534" }} />
                </a>

                <a
                  href={`tel:${PHONE_NUMBER}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.85rem",
                    padding: "1rem 1.25rem", borderRadius: 12,
                    background: "var(--cream)", border: "1px solid var(--border-light)",
                    textDecoration: "none",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", flexShrink: 0,
                  }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>Call Us Directly</p>
                    <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--text-muted)" }}>{PHONE_NUMBER}</p>
                  </div>
                  <ArrowRight size={16} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
                </a>

                <a
                  href="https://www.google.com/maps/search/?api=1&query=Gooty+RS+Anantapur+515402"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: "0.85rem",
                    padding: "1rem 1.25rem", borderRadius: 12,
                    background: "var(--cream)", border: "1px solid var(--border-light)",
                    textDecoration: "none",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#4338CA", flexShrink: 0,
                  }}>
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", color: "var(--text)" }}>Visit Our Store</p>
                    <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--text-muted)" }}>Gooty RS, Anantapur – 515402</p>
                  </div>
                  <ArrowRight size={16} style={{ marginLeft: "auto", color: "var(--text-muted)" }} />
                </a>
              </div>
            </FadeIn>

            {/* Right: inquiry form */}
            <FadeIn delay={0.15}>
              <div style={{
                background: "#fff", borderRadius: 20, padding: "2.5rem",
                border: "1px solid var(--border-light)",
                boxShadow: "0 8px 40px rgba(123,29,69,0.08)",
              }}>
                {sent ? (
                  <div style={{ textAlign: "center", padding: "2rem 0" }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: "50%",
                      background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 1.25rem", fontSize: "1.75rem",
                    }}>✓</div>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.3rem", color: "var(--text)", margin: "0 0 0.75rem",
                    }}>Inquiry Sent!</h3>
                    <p style={{ color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 1.75rem" }}>
                      Thank you! We've received your message and will get back to you shortly. For a quicker response, reach us on WhatsApp.
                    </p>
                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.5rem",
                          padding: "0.7rem 1.4rem", borderRadius: 8,
                          background: "#25D366", color: "#fff",
                          fontWeight: 700, fontSize: "0.85rem", textDecoration: "none",
                        }}
                      >
                        {WA_ICON} WhatsApp Us
                      </a>
                      <button
                        onClick={() => setSent(false)}
                        style={{
                          padding: "0.7rem 1.4rem", borderRadius: 8,
                          border: "1.5px solid var(--border)", background: "#fff",
                          cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-muted)",
                        }}
                      >
                        Send Another
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.3rem", color: "var(--primary)", margin: "0 0 0.4rem",
                    }}>Send an Inquiry</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: "0 0 1.75rem" }}>
                      Fill in the form and we'll reply within a few hours.
                    </p>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
                      <div>
                        <label style={labelStyle}>Full Name *</label>
                        <input
                          name="name" value={form.name} onChange={handleChange}
                          placeholder="Your full name" required
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Phone Number *</label>
                        <div style={{
                          display: "flex", alignItems: "center",
                          border: "1.5px solid var(--border-light)", borderRadius: 10, overflow: "hidden",
                          background: "#fff", transition: "border-color 0.2s",
                        }}>
                          <span style={{
                            padding: "0.7rem 0.9rem",
                            background: "var(--cream-deep)", borderRight: "1.5px solid var(--border-light)",
                            fontSize: "0.875rem", fontWeight: 700, color: "var(--text-muted)",
                            whiteSpace: "nowrap",
                          }}>+91</span>
                          <input
                            type="tel" name="phone" value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: stripPhone(e.target.value) })}
                            placeholder="XXXXX XXXXX" maxLength={10} required
                            style={{ border: "none", borderRadius: 0, flex: 1, minWidth: 0, background: "transparent" }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Email Address</label>
                        <input
                          name="email" type="email" value={form.email} onChange={handleChange}
                          placeholder="your@email.com (optional)"
                          style={inputStyle}
                        />
                      </div>

                      <div>
                        <label style={labelStyle}>Message *</label>
                        <textarea
                          name="message" value={form.message} onChange={handleChange}
                          placeholder="Tell us what you're looking for — a specific saree type, occasion, budget, or anything else..."
                          rows={5} required
                          style={{ ...inputStyle, resize: "vertical", minHeight: 110, lineHeight: 1.6 }}
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={submitting}
                        style={{
                          width: "100%", opacity: submitting ? 0.7 : 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          gap: "0.5rem", padding: "0.875rem",
                        }}
                      >
                        {submitting ? (
                          "Sending..."
                        ) : (
                          <><Send size={15} /> Send Inquiry</>
                        )}
                      </button>

                      <p style={{ margin: 0, fontSize: "0.73rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.5 }}>
                        By sending, you agree to our{" "}
                        <Link to="/privacy" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link>.
                        We never share your details.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── FAQ Strip ── */}
      <section style={{ background: "var(--cream)", padding: "4.5rem 1.5rem" }}>
        <div className="container">
          <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="section-tag">Quick Answers</span>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Common Questions</h2>
            <div className="section-divider" />
          </FadeIn>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
          }}>
            {[
              { q: "Do you accept custom orders?", a: "Yes! We specialise in custom orders. Share your requirements via WhatsApp and our team will guide you through fabric, colour, and weave options." },
              { q: "How long does delivery take?", a: "Standard delivery takes 3–7 business days depending on your location. You'll receive a tracking ID once your order is dispatched." },
              { q: "Can I return a saree if I don't like it?", a: "Absolutely. We offer 7-day easy returns. If you're not satisfied, contact us and we'll arrange a return and full refund." },
              { q: "Are the sarees genuinely handloom?", a: "Every handloom product is directly sourced from certified weavers. Products marked 'Genuine Handloom' carry our authenticity guarantee." },
            ].map(({ q, a }, i) => (
              <FadeIn key={q} delay={i * 0.07}>
                <div style={{
                  background: "#fff", borderRadius: 14, padding: "1.5rem",
                  border: "1px solid var(--border-light)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}>
                  <p style={{ margin: "0 0 0.6rem", fontWeight: 700, fontSize: "0.92rem", color: "var(--text)" }}>{q}</p>
                  <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{a}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section style={{
        background: "linear-gradient(135deg, #1A0E14, #7B1D45)",
        padding: "5rem 1.5rem", textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{
              color: "#fff", fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 800, margin: "0 0 1rem",
            }}>
              Ready to Find Your Perfect Saree?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 2.25rem" }}>
              Browse our curated collection of handloom and traditional sarees, or reach out directly and let our team help you find the one.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.85rem 1.75rem", borderRadius: 10,
                  background: "#25D366", color: "#fff",
                  fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
                }}
              >
                {WA_ICON} WhatsApp Us
              </a>
              <Link
                to="/shop"
                className="btn-gold"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                Browse Collection
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "var(--text)",
  marginBottom: "0.35rem",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.7rem 0.9rem",
  border: "1.5px solid var(--border-light)",
  borderRadius: 10,
  fontSize: "0.9rem",
  outline: "none",
  background: "#fff",
  transition: "border-color 0.2s",
};
