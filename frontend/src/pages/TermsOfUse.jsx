import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: "2rem" }}>
    <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>{title}</h2>
    <div style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default function TermsOfUse() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <div style={{ background: "#1A0812", padding: "0.85rem 2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <a href="/help" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
          <ArrowLeft size={14} /> Help Center
        </a>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Terms of Use</span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2rem 5rem" }}>
        <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em" }}>Legal</p>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 900, color: "#1A0812", fontFamily: "'Playfair Display', serif" }}>Terms of Use</h1>
        <p style={{ margin: "0 0 2.5rem", fontSize: "0.8rem", color: "#94A3B8" }}>Last updated: January 1, 2026</p>

        <div style={{ background: "#fff", borderRadius: 14, padding: "2rem", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #EEF2F7" }}>
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using Lakshmi Vastra Studio ("the Platform"), you agree to be bound by these Terms of Use. If you do not agree, please do not use the Platform.</p>
          </Section>

          <Section title="2. Use of the Platform">
            <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
              <li style={{ marginBottom: "0.5rem" }}>You must be at least 18 years old to use the Platform</li>
              <li style={{ marginBottom: "0.5rem" }}>You are responsible for maintaining the confidentiality of your account credentials</li>
              <li style={{ marginBottom: "0.5rem" }}>You agree not to misuse the Platform or engage in fraudulent activity</li>
              <li>You may not use the Platform for any unlawful purpose</li>
            </ul>
          </Section>

          <Section title="3. Orders and Payments">
            <p>All orders are subject to availability. Prices are in Indian Rupees (₹) and inclusive of applicable taxes. Payment is processed securely via Razorpay. We reserve the right to cancel orders in cases of pricing errors or stock unavailability.</p>
          </Section>

          <Section title="4. Shop Owners and Delivery Partners">
            <p>Shop owners and delivery partners are independent entities. Registration is subject to admin approval. Accounts may be suspended or terminated for violation of platform policies, fraudulent activity, or breach of these terms.</p>
          </Section>

          <Section title="5. Intellectual Property">
            <p>All content on this Platform including logos, designs, text, and images is the property of Lakshmi Vastra Studio. You may not reproduce, distribute, or create derivative works without prior written consent.</p>
          </Section>

          <Section title="6. Limitation of Liability">
            <p>Lakshmi Vastra Studio shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability shall not exceed the amount paid for the relevant order.</p>
          </Section>

          <Section title="7. Changes to Terms">
            <p>We may update these Terms at any time. Continued use of the Platform after changes constitutes your acceptance of the revised Terms.</p>
          </Section>

          <Section title="8. Contact">
            <p>For questions about these Terms, contact us via our <a href="/contact" style={{ color: "#7B1D45" }}>Contact page</a>.</p>
          </Section>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #E2E8F0", background: "#fff", padding: "1.25rem 2rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}><span style={{ color: "#7B1D45", fontWeight: 800 }}>Lakshmi Vastra Studio</span> © {new Date().getFullYear()}</p>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {[["Privacy Policy", "/privacy"], ["Cookie Policy", "/cookies"], ["Help Center", "/help"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: "0.73rem", color: "#64748B", textDecoration: "none", fontWeight: 500 }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
