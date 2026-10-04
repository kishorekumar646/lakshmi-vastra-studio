import { useState, useEffect } from "react";
import { getInstallPrompt, clearInstallPrompt } from "../pwaInstall";

const isMobile = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export function usePwaInstall() {
  const [prompt, setPrompt] = useState(() => getInstallPrompt());
  const [installed, setInstalled] = useState(isStandalone);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (installed) return;
    // Poll until beforeinstallprompt fires (Chrome fires it asynchronously, can take seconds)
    const check = setInterval(() => {
      const p = getInstallPrompt();
      if (p) { setPrompt(p); clearInterval(check); }
    }, 500);
    const onInstalled = () => { setInstalled(true); clearInstallPrompt(); setPrompt(null); };
    window.addEventListener("appinstalled", onInstalled);
    return () => { clearInterval(check); window.removeEventListener("appinstalled", onInstalled); };
  }, [installed]);

  const install = async () => {
    if (installed) return;
    const p = prompt || getInstallPrompt();
    if (p) {
      // Native install dialog available — use it
      p.prompt();
      const { outcome } = await p.userChoice;
      if (outcome === "accepted") { setInstalled(true); clearInstallPrompt(); }
      setPrompt(null);
    } else {
      // Browser not ready yet — show platform-specific guide sheet
      setGuideOpen(true);
    }
  };

  const closeGuide = () => setGuideOpen(false);

  // Show on mobile always (prompt fires once Chrome is satisfied), or desktop when prompt ready
  const canInstall = !installed && (isMobile() || !!prompt);

  return { canInstall, install, guideOpen, closeGuide };
}
