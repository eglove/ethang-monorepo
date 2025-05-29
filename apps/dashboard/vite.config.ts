import { cloudflare } from "@cloudflare/vite-plugin";
import TanStackRouterVite from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true, target: "react" }),
    react(),
    cloudflare(),
    VitePWA({
      injectRegister: "auto",
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globDirectory: "./dist/client",
        globPatterns: ["**/*.{js,css,html}"],
        navigationPreload: true,
        runtimeCaching: [
          {
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
            },
            urlPattern: /\.(?:js|css)$/u,
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
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/u,
          },
          {
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
            },
            urlPattern: /\.html$/u,
          },
          {
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "font-cache",
            },
            urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/u,
          },
        ],
        skipWaiting: true,
        sourcemap: false,
      },
    }),
  ],
});
