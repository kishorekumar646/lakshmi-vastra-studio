const CACHE = "lv-studio-v1";
const SHELL = ["/", "/catalog", "/contact", "/manifest.json", "/icon-192.svg", "/icon-512.svg"];

// Install: cache the app shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
//   - API calls → network first, no cache
//   - Cloudinary images → cache first (images rarely change)
//   - Everything else → network first, fall back to cache
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin API calls
  if (e.request.method !== "GET") return;
  if (url.pathname.startsWith("/api/")) return;

  // Cloudinary images: cache first
  if (url.hostname.includes("cloudinary.com") || url.hostname.includes("res.cloudinary.com")) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        });
      })
    );
    return;
  }

  // App shell & pages: network first, fall back to cache
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then((cached) => cached || caches.match("/")))
  );
});
