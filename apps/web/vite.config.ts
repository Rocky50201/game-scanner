import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

function normalizeBasePath(value: string | undefined): string {
  if (!value || value === "/") return "/";
  const leading = value.startsWith("/") ? value : `/${value}`;
  return leading.endsWith("/") ? leading : `${leading}/`;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = normalizeBasePath(env.VITE_BASE_PATH);

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
        includeAssets: [
          "favicon.svg",
          "robots.txt",
          "icons/apple-touch-icon.png",
          "models/model-manifest.json"
        ],
        manifest: {
          id: base,
          name: "Game Scanner Pro",
          short_name: "Game Scanner",
          description: "AI-assisted video game identification for collectors.",
          start_url: base,
          scope: base,
          display: "standalone",
          orientation: "portrait-primary",
          background_color: "#070b14",
          theme_color: "#0b1020",
          categories: ["utilities", "entertainment"],
          icons: [
            { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
            { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
            { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
          ]
        },
        workbox: {
          navigateFallback: `${base}index.html`,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ["**/*.{js,css,html,svg,png,json,ico,webmanifest,onnx}"],
  	  globIgnores: ["**/ort-wasm-*.wasm"]
        },
        devOptions: { enabled: true, type: "module" }
      })
    ],
    worker: { format: "es" },
    server: { host: true, port: 5173 },
    preview: { host: true, port: 4173 },
    build: { target: "es2022", sourcemap: true }
  };
});
