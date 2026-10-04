import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");
const portal = process.env.VITE_PORTAL;

if (portal === "shop" || portal === "delivery" || portal === "admin") {
  // Standalone portal build — just needs a simple catch-all redirect
  writeFileSync(`${distDir}/_redirects`, "/* /index.html 200\n");
  console.log(`✅ Portal build (${portal}): wrote simple _redirects`);
} else {
  // Main build — create per-portal HTML files for same-origin routing
  const base = readFileSync(`${distDir}/index.html`, "utf-8");

  const shopHtml = base
    .replace('href="/manifest.json"', 'href="/manifest-shop.json"')
    .replace(/content="#7B1D45"/, 'content="#7B1D45"')
    .replace(/<title>[^<]*<\/title>/, '<title>Shop Owner Portal — LV Studio</title>')
    .replace('href="/icon-192.svg"', 'href="/icon-shop.png"');

  writeFileSync(`${distDir}/shop.html`, shopHtml);
  console.log("✅ Created dist/shop.html");

  const deliveryHtml = base
    .replace('href="/manifest.json"', 'href="/manifest-delivery.json"')
    .replace(/content="#7B1D45"/, 'content="#1a4080"')
    .replace(/<title>[^<]*<\/title>/, '<title>Delivery Portal — LV Studio</title>')
    .replace('href="/icon-192.svg"', 'href="/icon-delivery.png"');

  writeFileSync(`${distDir}/delivery.html`, deliveryHtml);
  console.log("✅ Created dist/delivery.html");
}
