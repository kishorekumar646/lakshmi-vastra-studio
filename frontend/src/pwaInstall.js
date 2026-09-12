// Module-level store for the deferred beforeinstallprompt event.
// Captured in main.jsx, consumed by the Install page.
let _deferredPrompt = null;

export function setInstallPrompt(e) { _deferredPrompt = e; }
export function getInstallPrompt()  { return _deferredPrompt; }
export function clearInstallPrompt(){ _deferredPrompt = null; }
