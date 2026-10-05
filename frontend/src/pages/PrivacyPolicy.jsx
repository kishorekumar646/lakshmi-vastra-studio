import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: "2rem" }}>
    <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>{title}</h2>
    <div style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.8 }}>{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <div style={{ background: "#1A0812", padding: "0.85rem 2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <a href="/help" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
          <ArrowLeft size={14} /> Help Center
        </a>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Privacy Policy</span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2rem 5rem" }}>
        <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em" }}>Legal</p>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 900, color: "#1A0812", fontFamily: "'Playfair Display', serif" }}>Privacy Policy</h1>
        <p style={{ margin: "0 0 2.5rem", fontSize: "0.8rem", color: "#94A3B8" }}>Last updated: January 1, 2026</p>

        <div style={{ background: "#fff", borderRadius: 14, padding: "2rem 2rem", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #EEF2F7" }}>
          <Section title="1. Information We Collect">
            <p>We collect information you provide directly, including your name, email address, phone number, delivery address, and payment details when you create an account or place an order.</p>
            <p style={{ marginTop: "0.75rem" }}>We also automatically collect usage data such as pages visited, time spent, device type, and IP address to improve our services.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul style={{ paddingLeft: "1.25rem", margin: 0 }}>
              <li style={{ marginBottom: "0.5rem" }}>To process and fulfill your orders</li>
              <li style={{ marginBottom: "0.5rem" }}>To send order confirmations, updates, and delivery notifications</li>
              <li style={{ marginBottom: "0.5rem" }}>To manage your account and provide customer support</li>
              <li style={{ marginBottom: "0.5rem" }}>To improve our platform, products, and user experience</li>
              <li>To comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="3. Sharing Your Information">
            <p>We do not sell your personal information. We share data only with:</p>
            <ul style={{ paddingLeft: "1.25rem", margin: "0.75rem 0 0" }}>
              <li style={{ marginBottom: "0.5rem" }}>Shop owners — to fulfill your order (name, delivery address)</li>
              <li style={{ marginBottom: "0.5rem" }}>Delivery partners — to complete your delivery (name, address, phone)</li>
              <li style={{ marginBottom: "0.5rem" }}>Payment processors (Razorpay) — for secure transaction handling</li>
              <li>Cloud service providers (Cloudinary, Supabase) — for secure data storage</li>
            </ul>
          </Section>

          <Section title="4. Cookies">
            <p>We use essential, analytics, and personalization cookies. You can manage your cookie preferences at any time via the Cookie Settings in our banner. See our <a href="/cookies" style={{ color: "#7B1D45" }}>Cookie Policy</a> for details.</p>
          </Section>

          <Section title="5. Data Security">
            <p>We use industry-standard encryption (HTTPS/TLS) for all data in transit. Passwords are hashed using bcrypt and never stored in plain text. Bank details are stored encrypted and accessed only for payment settlement.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us via WhatsApp or email. We will respond within 30 days.</p>
          </Section>

          <Section title="7. Contact Us">
            <p>For privacy-related queries, contact Lakshmi Vastra Studio at the details provided on our <a href="/contact" style={{ color: "#7B1D45" }}>Contact page</a>.</p>
          </Section>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #E2E8F0", background: "#fff", padding: "1.25rem 2rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}><span style={{ color: "#7B1D45", fontWeight: 800 }}>Lakshmi Vastra Studio</span> © {new Date().getFullYear()}</p>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {[["Terms of Use", "/terms"], ["Cookie Policy", "/cookies"], ["Help Center", "/help"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: "0.73rem", color: "#64748B", textDecoration: "none", fontWeight: 500 }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
