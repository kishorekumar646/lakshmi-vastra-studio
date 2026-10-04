import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "../dist");

const base = readFileSync(`${distDir}/index.html`, "utf-8");

// Shop Owner portal
const shopHtml = base
  .replace('href="/manifest.json"', 'href="/manifest-shop.json"')
  .replace('<meta name="theme-color" content="#7B1D45" />', '<meta name="theme-color" content="#7B1D45" />')
  .replace(/<title>.*?<\/title>/, '<title>Shop Owner Portal — LV Studio</title>');

writeFileSync(`${distDir}/shop.html`, shopHtml);
console.log("✅ Created dist/shop.html");

// Delivery portal
const deliveryHtml = base
  .replace('href="/manifest.json"', 'href="/manifest-delivery.json"')
  .replace('<meta name="theme-color" content="#7B1D45" />', '<meta name="theme-color" content="#1a4080" />')
  .replace(/<title>.*?<\/title>/, '<title>Delivery Portal — LV Studio</title>');

writeFileSync(`${distDir}/delivery.html`, deliveryHtml);
console.log("✅ Created dist/delivery.html");
