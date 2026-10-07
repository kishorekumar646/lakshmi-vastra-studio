import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PHONE_NUMBER, WHATSAPP_NUMBER } from "../api";
import TrustBadges from "../components/TrustBadges";
import PageBanner from "../components/luxury/PageBanner";

/* ── Intersection-observer hook for scroll-in animations ── */
function useVisible(threshold = 0.15) {
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

/* ── Stat counter ── */
function StatCard({ value, label, icon, delay }) {
  const [ref, visible] = useVisible();
  return (
    <div ref={ref} style={{
      textAlign: "center", padding: "1.75rem 1rem",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
      transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`,
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
      <p style={{ fontSize: "2.2rem", fontWeight: 900, color: "var(--primary)", margin: "0 0 0.25rem", fontFamily: "Playfair Display, serif" }}>{value}</p>
      <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>{label}</p>
    </div>
  );
}

/* ── Value card ── */
function ValueCard({ icon, title, desc, delay }) {
  const [ref, visible] = useVisible();
  return (
    <div ref={ref} style={{
      background: "linear-gradient(135deg, #0D0611 0%, #1A0B1C 100%)",
      borderRadius: 16, padding: "1.75rem",
      border: "1px solid rgba(184,137,42,0.18)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: "rgba(184,137,42,0.12)",
        border: "1px solid rgba(184,137,42,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.6rem", marginBottom: "1.1rem",
      }}>{icon}</div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: "0.87rem", color: "rgba(201,186,178,0.75)", lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

export default function About() {
  useEffect(() => {
    document.title = "About Us | Lakshmi Vastra Studio";
    return () => { document.title = "Lakshmi Vastra Studio — Sarees & Ethnic Wear"; };
  }, []);

  const whatsappMsg = encodeURIComponent("Hi Lakshmi Vastra Studio! I'd like to know more about your collection.");

  return (
    <div style={{ overflowX: "hidden" }}>

      <PageBanner
        eyebrow="Our Story"
        title="Weaving Tradition into Every Thread"
        subtitle="Lakshmi Vastra Studio — founded to bring the finest handloom sarees from Indian weavers directly to your doorstep."
      />

      {/* ── Trust Badges ── */}
      <TrustBadges />

      {/* ── Stats ── */}
      <section style={{ background: "var(--cream-deep)", padding: "0.5rem 1.5rem" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem" }}>
            <StatCard value="500+" label="Sarees in Collection" icon="🥻" delay={0} />
            <StatCard value="1000+" label="Happy Customers" icon="😊" delay={0.1} />
            <StatCard value="50+" label="Master Weavers" icon="🧵" delay={0.2} />
            <StatCard value="5★" label="Average Rating" icon="⭐" delay={0.3} />
          </div>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "4rem", alignItems: "center" }}>
            <FadeIn>
              <span className="section-tag">Our Journey</span>
              <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Born from a Love for Indian Craft</h2>
              <div className="section-divider" style={{ marginBottom: "1.5rem" }} />
              <p style={{ color: "var(--text-muted)", lineHeight: 1.85, marginBottom: "1.25rem" }}>
                Lakshmi Vastra Studio began as a small family venture with deep roots in the textile heartland of India. We noticed a growing gap — skilled weavers creating extraordinary work, but struggling to reach customers who would truly value it.
              </p>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.85, marginBottom: "1.25rem" }}>
                We built bridges. Today, every saree you see in our collection has been personally sourced, quality-checked, and priced fairly — so the weaver earns a dignified income and you receive a piece of living heritage.
              </p>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.85 }}>
                Our studio is a GST-registered business, and every purchase comes with a proper invoice, easy returns, and a team that genuinely cares about your experience.
              </p>
            </FadeIn>

            {/* Visual story card */}
            <FadeIn delay={0.15}>
              <div style={{ position: "relative" }}>
                <div style={{
                  background: "linear-gradient(135deg, #0D0611 0%, #28092A 100%)",
                  borderRadius: 20, padding: "2.5rem",
                  border: "1px solid rgba(184,137,42,0.2)", boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
                }}>
                  {[
                    { year: "Day 1", event: "Founded with a vision to connect weavers & customers" },
                    { year: "Growing", event: "Onboarded 50+ master weavers across India" },
                    { year: "Online", event: "Launched our PWA — shop from anywhere, anytime" },
                    { year: "Today", event: "1000+ happy customers & growing" },
                  ].map(({ year, event }, i) => (
                    <div key={i} style={{ display: "flex", gap: "1rem", marginBottom: i < 3 ? "1.5rem" : 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "var(--primary)", color: "#fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.65rem", fontWeight: 800, textAlign: "center", lineHeight: 1.2,
                          padding: "0.2rem",
                        }}>{year}</div>
                        {i < 3 && <div style={{ width: 2, flex: 1, background: "rgba(255,255,255,0.12)", marginTop: "0.4rem" }} />}
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem", lineHeight: 1.6, paddingTop: "0.45rem" }}>{event}</p>
                    </div>
                  ))}
                </div>
                {/* Gold accent dot */}
                <div style={{
                  position: "absolute", top: -14, right: -14,
                  width: 56, height: 56, borderRadius: "50%",
                  background: "linear-gradient(135deg, #B8892A, #D4A94A)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.6rem", boxShadow: "0 4px 16px rgba(184,137,42,0.4)",
                }}>🥻</div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section style={{ background: "#FAFAF7", padding: "5rem 1.5rem" }}>
        <div className="container">
          <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="section-tag">Why Us</span>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>Why Customers Choose Lakshmi Vastra</h2>
            <div className="section-divider" />
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            <ValueCard icon="🔒" title="100% Secure Payments" delay={0}
              desc="Every online transaction is processed through Razorpay — India's most trusted payment gateway — with 256-bit SSL encryption." />
            <ValueCard icon="🚚" title="Cash on Delivery" delay={0.1}
              desc="Not comfortable paying online? Choose COD. Pay only when your saree arrives at your doorstep. No questions asked." />
            <ValueCard icon="↩️" title="7-Day Easy Returns" delay={0.2}
              desc="Not happy with your purchase? We'll make it right. Return within 7 days for a full refund — no lengthy forms, no hassle." />
            <ValueCard icon="🥻" title="Authentic Handloom" delay={0.3}
              desc="Every product is sourced directly from certified weavers. No middlemen, no machine imitations — only genuine handcrafted sarees." />
            <ValueCard icon="📱" title="Real-Time Order Tracking" delay={0.4}
              desc="Know exactly where your order is — confirmed, packed, out for delivery. Live status updates keep you informed every step." />
            <ValueCard icon="💬" title="Human Support" delay={0.5}
              desc="Have a question? WhatsApp or call us directly. A real person — not a bot — will respond and help you find the perfect saree." />
          </div>
        </div>
      </section>

      {/* ── Trust signals ── */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div className="container">
          <FadeIn style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span className="section-tag">Transparency</span>
            <h2 className="section-title" style={{ marginBottom: "0.5rem" }}>You Can Verify Us</h2>
            <div className="section-divider" />
            <p style={{ color: "var(--text-muted)", marginTop: "1rem", maxWidth: 540, margin: "1rem auto 0" }}>
              We are a registered business — completely transparent about who we are and how we operate.
            </p>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              { icon: "🏛️", label: "GST Registered", desc: "Proper tax invoices issued for every purchase" },
              { icon: "🔐", label: "SSL Secured", desc: "HTTPS encrypted — your data is always safe" },
              { icon: "💳", label: "Razorpay Certified", desc: "PCI-DSS compliant payment processing" },
              { icon: "📦", label: "Tracked Shipping", desc: "Every order ships with a tracking ID" },
            ].map(({ icon, label, desc }) => (
              <FadeIn key={label}>
                <div style={{
                  textAlign: "center", padding: "2rem 1.25rem",
                  background: "linear-gradient(135deg, #0D0611, #1A0B1C)", borderRadius: 16,
                  border: "1px solid rgba(184,137,42,0.18)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                }}>
                  <div style={{ fontSize: "2.25rem", marginBottom: "0.75rem" }}>{icon}</div>
                  <p style={{ margin: "0 0 0.4rem", fontWeight: 700, fontSize: "0.92rem", color: "#fff", fontFamily: "'Playfair Display', serif" }}>{label}</p>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "rgba(201,186,178,0.7)", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: "linear-gradient(135deg, #1A0E14, #7B1D45)",
        padding: "5rem 1.5rem", textAlign: "center",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <FadeIn>
            <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem,4vw,2.4rem)", fontWeight: 800, margin: "0 0 1rem" }}>
              Still Have Questions?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.7, margin: "0 0 2rem" }}>
              We'd love to hear from you. Reach us on WhatsApp, give us a call, or browse our collection and let the sarees speak for themselves.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.8rem 1.6rem", borderRadius: 10,
                  background: "#25D366", color: "#fff",
                  fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
                }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp Us
              </a>
              <a
                href={`tel:${PHONE_NUMBER}`}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.8rem 1.6rem", borderRadius: 10,
                  background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
                  color: "#fff", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none",
                }}
              >
                📞 {PHONE_NUMBER}
              </a>
              <Link to="/shop" className="btn-gold">Browse Collection</Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
