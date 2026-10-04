import { useEffect } from "react";

function detectPlatform() {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edg|opr/i.test(ua);
  if (isIOS) return "ios";
  if (isAndroid && isChrome) return "android";
  if (isChrome) return "desktop";
  return "other";
}

const platform = detectPlatform();

export default function InstallGuideSheet({ open, onClose, appName = "the app", iconEmoji = "📲", themeColor = "#7B1D45" }) {
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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          zIndex: 9998, backdropFilter: "blur(2px)",
        }}
      />

      {/* Sheet */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#fff", borderRadius: "20px 20px 0 0",
        padding: "1.5rem 1.5rem 2.5rem",
        zIndex: 9999, maxHeight: "80vh", overflowY: "auto",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.25)",
        animation: "slideUp 0.25s ease-out",
      }}>
        <style>{`@keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }`}</style>

        {/* Handle */}
        <div style={{ width: 40, height: 4, background: "#ddd", borderRadius: 2, margin: "0 auto 1.25rem" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "2rem" }}>{iconEmoji}</span>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#111" }}>Install {appName}</h2>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#666", marginTop: 2 }}>
              Add to your home screen for quick access
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: "auto", background: "none", border: "none", fontSize: "1.4rem",
                     cursor: "pointer", color: "#999", padding: "0.25rem", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {platform === "ios" ? (
          <IOSGuide themeColor={themeColor} />
        ) : platform === "android" ? (
          <AndroidGuide themeColor={themeColor} />
        ) : (
          <DesktopGuide themeColor={themeColor} />
        )}
      </div>
    </>
  );
}

function Step({ num, text, themeColor }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.9rem" }}>
      <span style={{
        flexShrink: 0, width: 26, height: 26, borderRadius: "50%",
        background: themeColor, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.82rem", fontWeight: 700,
      }}>{num}</span>
      <span style={{ fontSize: "0.93rem", color: "#333", lineHeight: 1.5, paddingTop: 3 }}
            dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );
}

function IOSGuide({ themeColor }) {
  return (
    <div>
      <p style={{ fontSize: "0.85rem", color: "#888", marginBottom: "1rem" }}>
        Open this page in <strong>Safari</strong> for the best experience.
      </p>
      <Step num={1} themeColor={themeColor}
        text='Tap the <strong>Share</strong> button ⬆️ at the bottom of Safari' />
      <Step num={2} themeColor={themeColor}
        text='Scroll down and tap <strong>"Add to Home Screen"</strong>' />
      <Step num={3} themeColor={themeColor}
        text='Tap <strong>"Add"</strong> in the top-right corner' />
      <p style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "0.75rem", textAlign: "center" }}>
        The app icon will appear on your home screen like any other app.
      </p>
    </div>
  );
}

function AndroidGuide({ themeColor }) {
  return (
    <div>
      <p style={{ fontSize: "0.85rem", color: "#555", marginBottom: "1rem", lineHeight: 1.6 }}>
        Chrome will show an install dialog shortly. If it doesn't appear automatically:
      </p>
      <Step num={1} themeColor={themeColor}
        text='Tap the <strong>⋮ menu</strong> in the top-right corner of Chrome' />
      <Step num={2} themeColor={themeColor}
        text='Tap <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>' />
      <Step num={3} themeColor={themeColor}
        text='Tap <strong>"Install"</strong> to confirm' />
      <p style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "0.75rem", textAlign: "center" }}>
        The app works offline and opens without a browser address bar.
      </p>
    </div>
  );
}

function DesktopGuide({ themeColor }) {
  return (
    <div>
      <Step num={1} themeColor={themeColor}
        text="Click the <strong>install icon ⊕</strong> in Chrome's address bar (right side)" />
      <Step num={2} themeColor={themeColor}
        text='Click <strong>"Install"</strong> in the popup dialog' />
      <p style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "0.75rem", textAlign: "center" }}>
        Or go to Chrome menu → More tools → Create shortcut (check "Open as window").
      </p>
    </div>
  );
}
