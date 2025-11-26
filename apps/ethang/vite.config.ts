import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      autoCodeSplitting: true,
      target: "react",
      verboseFileRoutes: false,
    }),
    react(),
    cloudflare(),
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globDirectory: "./dist/client",
        globPatterns: ["**/*.{js,css}"],
        navigationPreload: true,
        runtimeCaching: [
          {
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "swr-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24, // 1 day
                maxEntries: 50,
              },
            },
            urlPattern: ({ url }) => {
              return /\.(?:js|css|woff|woff2|ttf|otf|eot|ico)$/u.test(url.href);
            },
          },
          {
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                maxEntries: 50,
              },
            },
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|avif)$/u,
          },
        ],
        skipWaiting: true,
        sourcemap: false,
      },
    }),
    tailwindcss(),
  ],
  server: { hmr: { overlay: false } },
});
