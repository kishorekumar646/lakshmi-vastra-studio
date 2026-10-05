import { useState, useEffect } from "react";

const CONSENT_KEY = "lvs_cookie_consent";

const COOKIE_TYPES = [
  {
    key: "essential",
    label: "Essential Cookies",
    desc: "Required for the website to function. Cannot be disabled.",
    alwaysOn: true,
  },
  {
    key: "analytics",
    label: "Analytics Cookies",
    desc: "Help us understand how visitors interact with our website by collecting and reporting information anonymously.",
    alwaysOn: false,
  },
  {
    key: "personalization",
    label: "Personalization Cookies",
    desc: "Allow us to remember your preferences such as language, region, and to provide enhanced features.",
    alwaysOn: false,
  },
];

function Toggle({ on, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!on)}
      aria-pressed={on}
      style={{
        position: "relative", width: 40, height: 22, borderRadius: 999,
        border: "none", cursor: disabled ? "default" : "pointer", padding: 0, flexShrink: 0,
        background: on ? "#7B1D45" : "#CBD5E1",
        transition: "background 0.2s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: "50%", background: "#fff",
        transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
      }} />
    </button>
  );
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, personalization: false });

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) { setVisible(true); return; }
    try {
      const { savedAt } = JSON.parse(stored);
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (!savedAt || Date.now() - savedAt > oneDayMs) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (choice) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...choice, savedAt: Date.now() }));
    setVisible(false);
    setShowSettings(false);
  };

  const acceptAll  = () => save({ essential: true, analytics: true, personalization: true, level: "all" });
  const acceptRequired = () => save({ essential: true, analytics: false, personalization: false, level: "required" });
  const saveCustom = () => save({ essential: true, ...prefs, level: "custom" });

  if (!visible) return null;

  const S = {
    overlay: {
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      background: showSettings ? "rgba(0,0,0,0.45)" : "transparent",
      pointerEvents: showSettings ? "all" : "none",
    },
    banner: {
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10000,
      background: "#0F172A",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      padding: "1.25rem 1.5rem",
      boxShadow: "0 -4px 32px rgba(0,0,0,0.35)",
      pointerEvents: "all",
    },
    modal: {
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10001,
      background: "#fff", borderRadius: "16px 16px 0 0",
      maxHeight: "85vh", overflowY: "auto",
      boxShadow: "0 -8px 48px rgba(0,0,0,0.3)",
      padding: "1.5rem",
      pointerEvents: "all",
    },
    btnPrimary: {
      padding: "0.6rem 1.25rem", borderRadius: 8, border: "none",
      background: "#7B1D45", color: "#fff",
      fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
      whiteSpace: "nowrap", flexShrink: 0,
    },
    btnOutline: {
      padding: "0.6rem 1.25rem", borderRadius: 8,
      border: "1.5px solid rgba(255,255,255,0.25)", background: "transparent",
      color: "rgba(255,255,255,0.85)",
      fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
      whiteSpace: "nowrap", flexShrink: 0,
    },
    btnGhost: {
      padding: "0.6rem 1.25rem", borderRadius: 8, border: "none",
      background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)",
      fontWeight: 600, fontSize: "0.82rem", cursor: "pointer",
      whiteSpace: "nowrap", flexShrink: 0,
    },
  };

  return (
    <>
      {/* Settings modal */}
      {showSettings && (
        <div style={S.modal}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: "1.05rem", color: "#0F172A" }}>Cookie Settings</p>
            <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#64748B", lineHeight: 1 }}>✕</button>
          </div>
          <p style={{ fontSize: "0.82rem", color: "#64748B", lineHeight: 1.6, margin: "0 0 1.25rem" }}>
            Manage your cookie preferences below. Essential cookies are always active as they are required for the website to work correctly.
          </p>

          {COOKIE_TYPES.map((ct) => (
            <div key={ct.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", padding: "1rem 0", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.88rem", color: "#0F172A" }}>{ct.label}</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748B", lineHeight: 1.5 }}>{ct.desc}</p>
                {ct.alwaysOn && <p style={{ margin: "0.25rem 0 0", fontSize: "0.7rem", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase" }}>Always Active</p>}
              </div>
              <Toggle
                on={ct.alwaysOn || prefs[ct.key]}
                disabled={ct.alwaysOn}
                onChange={(v) => setPrefs((p) => ({ ...p, [ct.key]: v }))}
              />
            </div>
          ))}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <button onClick={acceptAll} style={{ ...S.btnPrimary, background: "#7B1D45" }}>Accept All</button>
            <button onClick={saveCustom} style={{ ...S.btnPrimary, background: "#1A0812" }}>Save My Preferences</button>
            <button onClick={acceptRequired} style={{ padding: "0.6rem 1.25rem", borderRadius: 8, border: "1.5px solid #E2E8F0", background: "#fff", color: "#475569", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>Required Only</button>
          </div>
          <p style={{ margin: "1.25rem 0 0", fontSize: "0.72rem", color: "#94A3B8", lineHeight: 1.5 }}>
            For more information, see our{" "}
            <a href="/privacy" style={{ color: "#7B1D45", textDecoration: "underline" }}>Privacy Notice</a>
            {" "}and{" "}
            <a href="/cookies" style={{ color: "#7B1D45", textDecoration: "underline" }}>Cookie Policy</a>.
          </p>
        </div>
      )}

      {/* Bottom banner */}
      {!showSettings && (
        <div style={S.banner}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              {/* Icon + text */}
              <div style={{ flex: 1, minWidth: 240 }}>
                <p style={{ margin: "0 0 0.3rem", fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>
                  🍪 Your Privacy Choices
                </p>
                <p style={{ margin: 0, fontSize: "0.76rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                  Lakshmi Vastra Studio uses cookies and tracking technologies to improve our services, analyse your interactions, and enhance your shopping experience.
                  Click <strong style={{ color: "rgba(255,255,255,0.8)" }}>"Accept All"</strong> to consent,{" "}
                  <strong style={{ color: "rgba(255,255,255,0.8)" }}>"Required Only"</strong> for essential cookies only, or customise via{" "}
                  <strong style={{ color: "rgba(255,255,255,0.8)" }}>"Cookie Settings"</strong>.{" "}
                  See our{" "}
                  <a href="/privacy" style={{ color: "#f0abca", textDecoration: "underline", fontSize: "0.76rem" }}>Privacy Notice</a>.
                </p>
              </div>
              {/* Buttons */}
              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
                <button onClick={acceptAll} style={S.btnPrimary}>Accept All</button>
                <button onClick={acceptRequired} style={S.btnOutline}>Required Only</button>
                <button onClick={() => setShowSettings(true)} style={S.btnGhost}>Cookie Settings</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
