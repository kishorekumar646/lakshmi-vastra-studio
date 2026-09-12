import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getInstallPrompt, clearInstallPrompt } from "../pwaInstall";

function detectPlatform() {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edg/i.test(ua);
  const isMac = /macintosh/i.test(ua) && !isIOS;
  const isWindows = /windows/i.test(ua);

  if (isIOS) return "ios";
  if (isAndroid && isChrome) return "android";
  if ((isMac || isWindows) && isChrome) return "desktop-chrome";
  if (isMac && isSafari) return "safari";
  return "other";
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
         window.navigator.standalone === true;
}

export default function Install() {
  const [platform] = useState(detectPlatform);
  const [installed, setInstalled] = useState(isStandalone);
  const [installing, setInstalling] = useState(false);
  const [done, setDone] = useState(false);
  const hasPrompt = !!getInstallPrompt();

  useEffect(() => {
    document.title = "Install App | Lakshmi Vastra Studio";
    window.addEventListener("appinstalled", () => { setDone(true); setInstalled(true); });
  }, []);

  async function handleInstall() {
    const prompt = getInstallPrompt();
    if (!prompt) return;
    setInstalling(true);
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") { clearInstallPrompt(); setDone(true); }
    setInstalling(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #0D0611 0%, #28092A 50%, #7B1D45 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "2rem 1.5rem", textAlign: "center",
    }}>
      {/* Logo */}
      <img src="/icon-512.svg" alt="Lakshmi Vastra Studio"
           style={{ width: 100, height: 100, borderRadius: 22, marginBottom: "1.5rem",
                    boxShadow: "0 8px 32px rgba(184,137,42,0.35)" }} />

      <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#fff",
                   fontSize: "clamp(1.6rem,5vw,2.1rem)", fontWeight: 700,
                   marginBottom: "0.4rem", lineHeight: 1.2 }}>
        Lakshmi Vastra Studio
      </h1>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                  color: "#D4A94A", fontSize: "1.1rem", marginBottom: "2rem" }}>
        Exquisite Sarees &amp; Ethnic Wear
      </p>

      {/* Card */}
      <div style={{
        background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(184,137,42,0.25)", borderRadius: 16,
        padding: "2rem 1.75rem", maxWidth: 420, width: "100%",
        boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
      }}>
        {installed || done ? (
          /* Already installed */
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h2 style={{ color: "#fff", fontFamily: "'Playfair Display',serif",
                         fontSize: "1.4rem", marginBottom: "0.5rem" }}>
              App Installed!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "1.5rem", lineHeight: 1.7 }}>
              Lakshmi Vastra Studio is now on your home screen. Open it anytime without a browser.
            </p>
            <Link to="/" style={btnStyle("#B8892A", "#fff")}>Open the Store →</Link>
          </>
        ) : platform === "ios" ? (
          /* iOS Safari instructions */
          <>
            <h2 style={headStyle}>Install on iPhone / iPad</h2>
            <p style={subStyle}>Follow these steps in <strong style={{ color: "#D4A94A" }}>Safari</strong>:</p>
            <ol style={{ textAlign: "left", color: "rgba(255,255,255,0.75)", lineHeight: 2,
                         paddingLeft: "1.25rem", marginBottom: "1.75rem", fontSize: "0.95rem" }}>
              <li>Tap the <strong style={{ color: "#D4A94A" }}>Share</strong> button <span style={{ fontSize:"1.1em" }}>⬆️</span> at the bottom of Safari</li>
              <li>Scroll down and tap <strong style={{ color: "#D4A94A" }}>"Add to Home Screen"</strong></li>
              <li>Tap <strong style={{ color: "#D4A94A" }}>"Add"</strong> in the top right corner</li>
            </ol>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.78rem" }}>
              The app icon will appear on your home screen like any other app.
            </p>
          </>
        ) : hasPrompt ? (
          /* Android / Chrome desktop — native prompt */
          <>
            <h2 style={headStyle}>Install the App</h2>
            <p style={subStyle}>
              Get instant access — no App Store needed. Works offline and loads instantly.
            </p>
            <ul style={{ textAlign: "left", color: "rgba(255,255,255,0.65)", lineHeight: 1.9,
                         paddingLeft: "1.25rem", marginBottom: "1.75rem", fontSize: "0.9rem" }}>
              <li>Opens like a native app — no browser bar</li>
              <li>Works even with slow internet</li>
              <li>Free — takes &lt;1 MB of space</li>
            </ul>
            <button onClick={handleInstall} disabled={installing}
                    style={btnStyle("#B8892A", "#fff")}>
              {installing ? "Installing…" : "📲 Install App Now"}
            </button>
          </>
        ) : (
          /* Fallback — already installed or unsupported browser */
          <>
            <h2 style={headStyle}>Add to Home Screen</h2>
            <p style={subStyle}>
              Open this page in <strong style={{ color: "#D4A94A" }}>Chrome</strong> (Android / PC) or
              <strong style={{ color: "#D4A94A" }}> Safari</strong> (iPhone) to install the app.
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem", marginTop: "1.25rem" }}>
              In Chrome: tap ⋮ menu → "Add to Home screen"
            </p>
          </>
        )}
      </div>

      {/* Browse without installing */}
      {!installed && !done && (
        <Link to="/" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.82rem",
                              marginTop: "1.5rem", textDecoration: "none" }}>
          Browse without installing →
        </Link>
      )}
    </div>
  );
}

const headStyle = {
  color: "#fff", fontFamily: "'Playfair Display',serif",
  fontSize: "1.3rem", marginBottom: "0.6rem",
};
const subStyle = {
  color: "rgba(255,255,255,0.65)", lineHeight: 1.75,
  marginBottom: "1.25rem", fontSize: "0.93rem",
};
function btnStyle(bg, color) {
  return {
    display: "inline-block", background: bg, color,
    padding: "0.9rem 2rem", borderRadius: 6, border: "none",
    fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
    letterSpacing: "0.04em", textDecoration: "none",
    width: "100%", boxSizing: "border-box",
    transition: "opacity 0.2s",
  };
}
