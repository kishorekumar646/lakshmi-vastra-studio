import { useState, useEffect } from "react";

const isMobile = () => /android|iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

export function usePwaInstall() {
  const [prompt, setPrompt] = useState(() => window.__pwaPrompt || null);
  const [installed, setInstalled] = useState(isStandalone);

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
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setPrompt(null);
      window.__pwaPrompt = null;
    }
    // If no prompt yet, Chrome will show its own install banner when ready
  };

  // Always show on mobile (unless already installed), show on desktop only when prompt is ready
  const canInstall = !installed && (isMobile() || !!prompt);

  return { canInstall, install };
}
