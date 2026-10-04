import { useEffect } from "react";

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua) && /chrome/i.test(ua) && !/edg|opr/i.test(ua)) return "android";
  if (/chrome/i.test(ua) && !/edg|opr/i.test(ua)) return "desktop";
  return "other";
}

const platform = detectPlatform();

const DEFAULT_FEATURES = [
  { icon: "📱", text: "Opens like a native app — no browser bar" },
  { icon: "🌐", text: "Works even with slow internet" },
  { icon: "✨", text: "Free — takes less than 1 MB of space" },
];

export default function InstallGuideSheet({
  open, onClose,
  appName = "the app",
  iconEmoji = "📲",
  iconSrc = null,
  themeColor = "#7B1D45",
  tagline = "Get instant access — no App Store needed.",
  features,
  hasNativePrompt = false,
  onNativeInstall,
  installing = false,
  installed = false,
}) {
  const featureList = features && features.length ? features : DEFAULT_FEATURES;

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          zIndex: 9998,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Bottom sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        zIndex: 9999,
        borderRadius: "20px 20px 0 0",
        overflow: "hidden",
        boxShadow: "0 -16px 48px rgba(0,0,0,0.4)",
        animation: "lvInstallUp 0.3s cubic-bezier(0.32,0.72,0,1)",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
      }}>
        <style>{`
          @keyframes lvInstallUp {
            from { transform: translateY(100%); opacity:0 }
            to   { transform: translateY(0);    opacity:1 }
          }
        `}</style>

        {/* Dark gradient header — matches Install.jsx style */}
        <div style={{
          background: `linear-gradient(150deg, #0D0611 0%, #28092A 50%, ${themeColor} 100%)`,
          padding: "2rem 1.5rem 1.75rem",
          position: "relative",
          flexShrink: 0,
        }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position: "absolute", top: "1rem", right: "1rem",
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", borderRadius: "50%",
            width: 32, height: 32, cursor: "pointer",
            fontSize: "1.1rem", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>×</button>

          {/* App icon */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {iconSrc ? (
              <img src={iconSrc} alt={appName} style={{
                width: 72, height: 72, borderRadius: 18,
                boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
              }} />
            ) : (
              <div style={{
                width: 72, height: 72, borderRadius: 18,
                background: "rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "2.2rem",
                boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
              }}>{iconEmoji}</div>
            )}
            <div>
              <h2 style={{
                margin: 0,
                fontFamily: "'Playfair Display', serif",
                color: "#fff",
                fontSize: "1.25rem",
                fontWeight: 700,
                lineHeight: 1.2,
              }}>{appName}</h2>
              <p style={{
                margin: "0.3rem 0 0",
                color: "#D4A94A",
                fontSize: "0.82rem",
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
              }}>{tagline}</p>
            </div>
          </div>
        </div>

        {/* White content area */}
        <div style={{ background: "#fff", padding: "1.5rem 1.5rem 2rem", overflowY: "auto" }}>

          {installed ? (
            <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✅</div>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700, color: "#111" }}>
                App Installed!
              </h3>
              <p style={{ color: "#666", fontSize: "0.9rem", lineHeight: 1.7, margin: "0 0 1.25rem" }}>
                The app is now on your home screen. Open it anytime without a browser.
              </p>
              <button onClick={onClose} style={primaryBtn(themeColor)}>Done ✓</button>
            </div>

          ) : hasNativePrompt && platform !== "ios" ? (
            /* Chrome Android / Desktop — native prompt ready */
            <>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 700, color: "#111" }}>
                Install the App
              </h3>
              <p style={{ margin: "0 0 1rem", color: "#555", fontSize: "0.88rem", lineHeight: 1.65 }}>
                Get instant access — no App Store needed. Works offline and loads instantly.
              </p>
              <ul style={{ margin: "0 0 1.25rem", padding: 0, listStyle: "none" }}>
                {featureList.map((f, i) => (
                  <li key={i} style={{
                    display: "flex", alignItems: "center", gap: "0.65rem",
                    marginBottom: "0.6rem", fontSize: "0.9rem", color: "#333",
                  }}>
                    <span style={{ fontSize: "1.1rem" }}>{f.icon}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <button onClick={onNativeInstall} disabled={installing} style={primaryBtn(themeColor)}>
                {installing ? "Installing…" : "📲 Install App Now"}
              </button>
              <button onClick={onClose} style={ghostBtn}>Not now</button>
            </>

          ) : platform === "ios" ? (
            /* iOS Safari */
            <>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700, color: "#111" }}>
                Install on iPhone / iPad
              </h3>
              <p style={{ margin: "0 0 1rem", color: "#555", fontSize: "0.88rem" }}>
                Follow these steps in <strong>Safari</strong>:
              </p>
              <StepRow num={1} themeColor={themeColor}
                text="Tap the <strong>Share</strong> button ⬆️ at the bottom of Safari" />
              <StepRow num={2} themeColor={themeColor}
                text='Scroll and tap <strong>"Add to Home Screen"</strong>' />
              <StepRow num={3} themeColor={themeColor}
                text='Tap <strong>"Add"</strong> in the top-right corner' />
              <p style={{ color: "#bbb", fontSize: "0.78rem", textAlign: "center", marginTop: "0.75rem" }}>
                The app icon will appear on your home screen like any other app.
              </p>
              <button onClick={onClose} style={primaryBtn(themeColor)}>Got it</button>
            </>

          ) : (
            /* Android — prompt not fired yet */
            <>
              <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem", fontWeight: 700, color: "#111" }}>
                Add to Home Screen
              </h3>
              <p style={{ margin: "0 0 1rem", color: "#555", fontSize: "0.88rem", lineHeight: 1.65 }}>
                Chrome will offer an install dialog shortly. If it doesn't appear:
              </p>
              <StepRow num={1} themeColor={themeColor}
                text="Tap the <strong>⋮ menu</strong> in Chrome's top-right corner" />
              <StepRow num={2} themeColor={themeColor}
                text='Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>' />
              <StepRow num={3} themeColor={themeColor}
                text="Tap <strong>Install</strong> to confirm" />
              <button onClick={onClose} style={primaryBtn(themeColor)}>Got it</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function StepRow({ num, text, themeColor }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.85rem" }}>
      <span style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
        background: themeColor, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.8rem", fontWeight: 700,
      }}>{num}</span>
      <span style={{ fontSize: "0.9rem", color: "#333", lineHeight: 1.55, paddingTop: 3 }}
        dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

function primaryBtn(themeColor) {
  return {
    display: "block", width: "100%",
    background: themeColor, color: "#fff",
    border: "none", borderRadius: 10,
    padding: "0.9rem", marginTop: "1.1rem",
    fontSize: "1rem", fontWeight: 700, cursor: "pointer",
    boxShadow: `0 4px 16px ${themeColor}55`,
    letterSpacing: "0.02em",
  };
}

const ghostBtn = {
  display: "block", width: "100%",
  background: "none", border: "none",
  color: "#aaa", fontSize: "0.88rem",
  padding: "0.65rem", marginTop: "0.25rem",
  cursor: "pointer", fontWeight: 500,
};
