import { ArrowLeft } from "lucide-react";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: "2rem" }}>
    <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.05rem", fontWeight: 800, color: "#0F172A" }}>{title}</h2>
    <div style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.8 }}>{children}</div>
  </div>
);

const CookieTable = ({ rows }) => (
  <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
      <thead>
        <tr style={{ background: "#F8FAFC" }}>
          {["Cookie Name", "Type", "Purpose", "Duration"].map((h) => (
            <th key={h} style={{ padding: "0.6rem 0.85rem", textAlign: "left", fontWeight: 700, color: "#475569", borderBottom: "2px solid #E2E8F0", whiteSpace: "nowrap" }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
            {r.map((cell, j) => (
              <td key={j} style={{ padding: "0.6rem 0.85rem", color: "#475569", fontFamily: j === 0 ? "monospace" : undefined, fontSize: j === 0 ? "0.78rem" : undefined }}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function CookiePolicy() {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <div style={{ background: "#1A0812", padding: "0.85rem 2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <a href="/help" style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
          <ArrowLeft size={14} /> Help Center
        </a>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>|</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Cookie Policy</span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "3rem 2rem 5rem" }}>
        <p style={{ margin: "0 0 0.4rem", fontSize: "0.7rem", fontWeight: 800, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.12em" }}>Legal</p>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 900, color: "#1A0812", fontFamily: "'Playfair Display', serif" }}>Cookie Policy</h1>
        <p style={{ margin: "0 0 2.5rem", fontSize: "0.8rem", color: "#94A3B8" }}>Last updated: January 1, 2026</p>

        <div style={{ background: "#fff", borderRadius: 14, padding: "2rem", boxShadow: "0 1px 8px rgba(0,0,0,0.06)", border: "1px solid #EEF2F7" }}>
          <Section title="What Are Cookies?">
            <p>Cookies are small text files stored on your device when you visit a website. They help us remember your preferences, keep you logged in, and understand how you use our platform.</p>
          </Section>

          <Section title="Types of Cookies We Use">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {[
                { type: "Essential", color: "#16a34a", bg: "rgba(22,163,74,0.08)", desc: "Required for the website to function. These cannot be disabled. They include authentication tokens and session identifiers." },
                { type: "Analytics", color: "#0e7490", bg: "rgba(14,116,144,0.08)", desc: "Help us understand how visitors interact with our platform by collecting anonymous usage statistics." },
                { type: "Personalization", color: "#7c3aed", bg: "rgba(124,58,237,0.08)", desc: "Remember your preferences such as sidebar state, selected filters, and display settings." },
              ].map((c) => (
                <div key={c.type} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", padding: "0.85rem", borderRadius: 10, background: c.bg, border: `1px solid ${c.color}22` }}>
                  <span style={{ fontWeight: 800, fontSize: "0.75rem", color: c.color, minWidth: 100, paddingTop: 2 }}>{c.type}</span>
                  <p style={{ margin: 0, fontSize: "0.83rem", color: "#475569", lineHeight: 1.65 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Specific Cookies We Set">
            <CookieTable rows={[
              ["lvs_cookie_consent", "Essential", "Stores your cookie preference choice", "1 year"],
              ["shop_token", "Essential", "Shop owner authentication token", "Session"],
              ["delivery_token", "Essential", "Delivery partner authentication token", "Session"],
              ["admin_token", "Essential", "Admin authentication token", "Session"],
              ["customer_token", "Essential", "Customer authentication token", "Session"],
              ["shop_sidebar_collapsed", "Personalization", "Remembers sidebar state in Shop Portal", "Persistent"],
              ["delivery_sidebar_collapsed", "Personalization", "Remembers sidebar state in Delivery Portal", "Persistent"],
              ["admin_sidebar_collapsed", "Personalization", "Remembers sidebar state in Admin Portal", "Persistent"],
            ]} />
          </Section>

          <Section title="Managing Your Cookie Preferences">
            <p>You can update your cookie preferences at any time by clicking <strong>"Cookie Settings"</strong> in the banner at the bottom of the page, or by clearing your browser's local storage. Note that disabling essential cookies will prevent you from logging in.</p>
          </Section>

          <Section title="Third-Party Services">
            <p>We use the following third-party services that may set their own cookies:</p>
            <ul style={{ paddingLeft: "1.25rem", margin: "0.75rem 0 0" }}>
              <li style={{ marginBottom: "0.5rem" }}><strong>Razorpay</strong> — payment processing</li>
              <li style={{ marginBottom: "0.5rem" }}><strong>Cloudinary</strong> — image hosting and delivery</li>
              <li><strong>Google</strong> — sign-in authentication (optional)</li>
            </ul>
          </Section>

          <Section title="Contact">
            <p>For questions about our cookie usage, see our <a href="/privacy" style={{ color: "#7B1D45" }}>Privacy Policy</a> or contact us via the <a href="/contact" style={{ color: "#7B1D45" }}>Contact page</a>.</p>
          </Section>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #E2E8F0", background: "#fff", padding: "1.25rem 2rem" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", color: "#94A3B8" }}><span style={{ color: "#7B1D45", fontWeight: 800 }}>Lakshmi Vastra Studio</span> © {new Date().getFullYear()}</p>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            {[["Privacy Policy", "/privacy"], ["Terms of Use", "/terms"], ["Help Center", "/help"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: "0.73rem", color: "#64748B", textDecoration: "none", fontWeight: 500 }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
