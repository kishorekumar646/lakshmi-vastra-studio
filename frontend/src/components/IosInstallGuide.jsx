export default function InstallGuide({ onClose, appName = "this app", platform = "ios" }) {
  const isAndroid = platform === "android";

  const steps = isAndroid
    ? [
        { text: <>Open the <strong>Chrome menu</strong> (tap ⋮ in the top-right corner)</> },
        { text: <>Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></> },
        { text: <>Tap <strong>"Add"</strong> to confirm</> },
      ]
    : [
        { text: <>Tap the <strong>Share button</strong> at the bottom of Safari <span style={{ fontSize: "1.1rem" }}>⎋</span></> },
        { text: <>Scroll down and tap <strong>"Add to Home Screen"</strong> <span style={{ fontSize: "1rem" }}>➕</span></> },
        { text: <>Tap <strong>"Add"</strong> in the top-right corner</> },
      ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: "#fff", borderRadius: "20px 20px 0 0", padding: "1.5rem 1.5rem 2.5rem",
        width: "100%", maxWidth: 480, boxShadow: "0 -8px 32px rgba(0,0,0,0.18)",
      }}>
        <div style={{ width: 40, height: 4, background: "#E2E8F0", borderRadius: 2, margin: "0 auto 1.25rem" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "1.6rem" }}>{isAndroid ? "🤖" : "🍎"}</span>
          <p style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0F172A", margin: 0 }}>
            Install {appName}
          </p>
        </div>
        <p style={{ fontSize: "0.82rem", color: "#64748B", margin: "0 0 1.25rem" }}>
          {isAndroid
            ? "Add this app to your Home Screen for quick access."
            : "Add to your Home Screen from Safari for the best experience."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <div style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: "50%",
                background: "#1a4080", color: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 800, fontSize: "0.78rem",
              }}>{i + 1}</div>
              <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>{s.text}</p>
            </div>
          ))}
        </div>

        <button onClick={onClose} style={{
          marginTop: "1.5rem", width: "100%", padding: "0.85rem",
          background: "#1a4080", color: "#fff", border: "none", borderRadius: 12,
          fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
        }}>
          Got it
        </button>
      </div>
    </div>
  );
}
