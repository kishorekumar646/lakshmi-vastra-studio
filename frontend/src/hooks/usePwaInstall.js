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
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (installed) return;
    const check = setInterval(() => {
      const p = getInstallPrompt();
      if (p) { setPrompt(p); clearInterval(check); }
    }, 500);
    const onInstalled = () => { setInstalled(true); clearInstallPrompt(); setPrompt(null); setGuideOpen(false); };
    window.addEventListener("appinstalled", onInstalled);
    return () => { clearInterval(check); window.removeEventListener("appinstalled", onInstalled); };
  }, [installed]);

  // Always open the popup sheet first
  const install = () => {
    if (installed) return;
    setGuideOpen(true);
  };

  // Called from inside the popup when user taps the install button
  const nativeInstall = async () => {
    const p = prompt || getInstallPrompt();
    if (!p) return false;
    setInstalling(true);
    p.prompt();
    const { outcome } = await p.userChoice;
    setInstalling(false);
    if (outcome === "accepted") {
      setInstalled(true);
      clearInstallPrompt();
      setPrompt(null);
      setGuideOpen(false);
    }
    return outcome === "accepted";
  };

  const closeGuide = () => setGuideOpen(false);

  const hasNativePrompt = !!(prompt || getInstallPrompt());
  const canInstall = !installed && (isMobile() || hasNativePrompt);

  return { canInstall, install, nativeInstall, hasNativePrompt, installing, guideOpen, closeGuide, installed };
}
