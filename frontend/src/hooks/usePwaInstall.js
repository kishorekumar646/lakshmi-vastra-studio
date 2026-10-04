import { useState, useEffect } from "react";
import { getInstallPrompt, clearInstallPrompt } from "../pwaInstall";

const isMobile = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent);
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export function usePwaInstall() {
  const [prompt, setPrompt] = useState(() => getInstallPrompt());
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    if (installed) return;

    // Poll in case beforeinstallprompt fires after mount
    const check = setInterval(() => {
      const p = getInstallPrompt();
      if (p) { setPrompt(p); clearInterval(check); }
    }, 500);

    const onInstalled = () => { setInstalled(true); clearInstallPrompt(); setPrompt(null); };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      clearInterval(check);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed]);

  const install = async () => {
    const p = prompt || getInstallPrompt();
    if (p) {
      p.prompt();
      const { outcome } = await p.userChoice;
      if (outcome === "accepted") { setInstalled(true); clearInstallPrompt(); }
      setPrompt(null);
      return;
    }
    // No prompt available — direct user to install page
    if (isIos()) {
      window.location.href = "/install";
    } else {
      window.location.href = "/install";
    }
  };

  const canInstall = !installed && (isMobile() || !!prompt);

  return { canInstall, install };
}
