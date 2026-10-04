import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const PORTAL_META = {
  shop: {
    title: "Shop Owner Portal — LV Studio",
    manifest: "/manifest-shop-standalone.json",
    themeColor: "#7B1D45",
    appleTitle: "LV Shop",
    description: "Manage your shop, products and orders",
  },
  delivery: {
    title: "Delivery Portal — LV Studio",
    manifest: "/manifest-delivery-standalone.json",
    themeColor: "#1a4080",
    appleTitle: "LV Delivery",
    description: "View and manage your assigned deliveries",
  },
  admin: {
    title: "Admin — LV Studio",
    manifest: "/manifest-admin-standalone.json",
    themeColor: "#1E293B",
    appleTitle: "LV Admin",
    description: "Admin dashboard for Lakshmi Vastra Studio",
  },
};

export default defineConfig(() => {
  const portal = process.env.VITE_PORTAL;
  const meta = PORTAL_META[portal];

  return {
    plugins: [
      react(),
      // Swap manifest + metadata in index.html for portal builds
      meta && {
        name: "portal-html-transform",
        transformIndexHtml(html) {
          return html
            .replace('href="/manifest.json"', `href="${meta.manifest}"`)
            .replace(/content="#7B1D45"/, `content="${meta.themeColor}"`)
            .replace(/(<title>)[^<]*(<\/title>)/, `$1${meta.title}$2`)
            .replace(/content="LV Studio"/, `content="${meta.appleTitle}"`)
            .replace(/(<meta name="description" content=")[^"]*"/, `$1${meta.description}"`);
        },
      },
    ].filter(Boolean),
  };
});
