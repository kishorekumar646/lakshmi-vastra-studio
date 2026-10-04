const BADGES = [
  { icon: "🔒", title: "Secure Payments", sub: "Powered by Razorpay" },
  { icon: "🚚", title: "Cash on Delivery", sub: "Pay when you receive" },
  { icon: "↩️", title: "Easy Returns", sub: "7-day hassle-free" },
  { icon: "🏆", title: "Genuine Products", sub: "100% authentic sarees" },
  { icon: "📞", title: "Live Support", sub: "WhatsApp & call" },
  { icon: "✅", title: "Verified Business", sub: "GST registered" },
];

export default function TrustBadges({ compact = false }) {
  if (compact) {
    return (
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "0.6rem",
        justifyContent: "center", padding: "0.75rem 0",
      }}>
        {BADGES.map(({ icon, title }) => (
          <span key={title} style={{
            display: "inline-flex", alignItems: "center", gap: "0.35rem",
            padding: "0.3rem 0.75rem", borderRadius: 20,
            background: "var(--cream)", border: "1px solid var(--border)",
            fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)",
          }}>
            {icon} {title}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderTop: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)", padding: "1.75rem 0" }}>
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1.25rem" }}>
          {BADGES.map(({ icon, title, sub }) => (
            <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: "var(--cream-deep)", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
              }}>{icon}</div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem", color: "var(--text)" }}>{title}</p>
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
