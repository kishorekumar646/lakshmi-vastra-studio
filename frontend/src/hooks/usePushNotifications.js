import { useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function subscribeToPush(userType, userId, token) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const { data } = await axios.get(`${API_URL}/api/push/vapid-public-key`);
    if (!data.public_key) return;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.public_key),
    });

    const sub = subscription.toJSON();
    await axios.post(
      `${API_URL}/api/push/subscribe`,
      {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_type: userType,
        user_id: userId || null,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch {
    // Push not available or blocked — fail silently
  }
}

export function usePushNotifications(userType, userId, token) {
  useEffect(() => {
    if (!token) return;
    subscribeToPush(userType, userId, token);
  }, [userType, userId, token]);
}
