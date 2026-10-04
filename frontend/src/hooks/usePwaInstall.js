import { useState, useEffect } from "react";

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isMobileDevice = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export function usePwaInstall() {
  const [prompt, setPrompt] = useState(() => window.__pwaPrompt || null);
  const [installed, setInstalled] = useState(isStandalone);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (installed) return;
    if (window.__pwaPrompt && !prompt) setPrompt(window.__pwaPrompt);

    const onReady = () => { if (window.__pwaPrompt) setPrompt(window.__pwaPrompt); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); window.__pwaPrompt = null; };

    window.addEventListener("pwaPromptReady", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwaPromptReady", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed, prompt]);

  const install = async () => {
    if (prompt) {
      // Chrome/Edge on Android or Desktop — native install dialog
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setPrompt(null);
      window.__pwaPrompt = null;
    } else {
      // iOS Safari or Android Chrome (prompt not ready yet) — show manual guide
      setShowGuide(true);
    }
  };

  // Show button on mobile always, or desktop when prompt is ready
  const canInstall = !installed && (!!prompt || isMobileDevice());

  return {
    canInstall,
    installed,
    install,
    showGuide,
    setShowGuide,
    platform: isIos() ? "ios" : isAndroid() ? "android" : "desktop",
  };
}
