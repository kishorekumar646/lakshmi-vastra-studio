import { useEffect, useRef, useState } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleSignInButton({ onCredential }) {
  const btnRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) { setUnavailable(true); return; }

    const init = () => {
      if (!window.google?.accounts?.id) { setUnavailable(true); return; }
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => onCredential(res.credential),
        ux_mode: "popup",
      });
      setReady(true);
    };

    // GIS script may already be loaded
    if (window.google?.accounts?.id) { init(); return; }

    // Wait for it
    const interval = setInterval(() => {
      if (window.google?.accounts?.id) { clearInterval(interval); init(); }
    }, 100);
    const timeout = setTimeout(() => { clearInterval(interval); setUnavailable(true); }, 5000);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [onCredential]);

  useEffect(() => {
    if (ready && btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: btnRef.current.offsetWidth || 340,
      });
    }
  }, [ready]);

  if (unavailable || !GOOGLE_CLIENT_ID) return null;

  return (
    <div
      ref={btnRef}
      style={{ width: "100%", display: "flex", justifyContent: "center", minHeight: 44 }}
    />
  );
}
