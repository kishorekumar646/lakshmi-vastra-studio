import { useState, useEffect } from "react";

export function usePwaInstall() {
  const [prompt, setPrompt] = useState(() => window.__pwaPrompt || null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia("(display-mode: standalone)").matches
  );

  useEffect(() => {
    if (installed) return;

    // Already captured before React mounted
    if (window.__pwaPrompt && !prompt) {
      setPrompt(window.__pwaPrompt);
    }

    // Fires if the event arrives after React mounts
    const onReady = () => {
      if (window.__pwaPrompt) setPrompt(window.__pwaPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
      window.__pwaPrompt = null;
    };

    window.addEventListener("pwaPromptReady", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("pwaPromptReady", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [installed, prompt]);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setPrompt(null);
    window.__pwaPrompt = null;
  };

  return { canInstall: !!prompt && !installed, installed, install };
}
