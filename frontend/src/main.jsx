import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";
import { setInstallPrompt } from "./pwaInstall.js";

// Capture the install prompt as early as possible
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  setInstallPrompt(e);
});

// Register service worker; auto-reload when a new SW takes over
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      // When a new SW installs, tell it to skip waiting immediately
      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          // New SW has activated and taken control — reload to use fresh assets
          if (newSW.state === "activated" && navigator.serviceWorker.controller) {
            window.location.reload();
          }
        });
      });
    }).catch(() => {});
    // Also reload if the SW controller changes (covers skipWaiting from another tab)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
    </BrowserRouter>
  </StrictMode>
);
