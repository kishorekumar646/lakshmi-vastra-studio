import { useState, useEffect } from "react";
import { getInstallPrompt, clearInstallPrompt } from "../pwaInstall";

const isMobile = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export function usePwaInstall() {
  const [prompt, setPrompt] = useState(() => getInstallPrompt());
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    if (installed) return;
    // Poll until beforeinstallprompt fires (can take a moment on mobile)
    const check = setInterval(() => {
      const p = getInstallPrompt();
      if (p) { setPrompt(p); clearInterval(check); }
    }, 500);
    const onInstalled = () => { setInstalled(true); clearInstallPrompt(); setPrompt(null); };
    window.addEventListener("appinstalled", onInstalled);
    return () => { clearInterval(check); window.removeEventListener("appinstalled", onInstalled); };
  }, [installed]);

  const install = async () => {
    const p = prompt || getInstallPrompt();
    if (!p) return;
    p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === "accepted") { setInstalled(true); clearInstallPrompt(); }
    setPrompt(null);
  };

  // Show on mobile always (prompt fires once the browser is happy), or desktop when ready
  const canInstall = !installed && (isMobile() || !!prompt);

  return { canInstall, install };
}
