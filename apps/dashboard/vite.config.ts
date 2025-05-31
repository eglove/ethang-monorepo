/* eslint-disable lodash/prefer-lodash-method */
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
              cacheName: "swr-cache",
              expiration: {
                maxAgeSeconds: 60 * 60 * 24, // 1 day
                maxEntries: 50,
              },
            },
            urlPattern: ({ url }) => {
              return (
                /\.(?:js|css|woff|woff2|ttf|otf|eot|ico)$/u.test(url.href) ||
                url.pathname.startsWith("/api/")
              );
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
              cacheName: "clerk-cache",
              expiration: {
                maxAgeSeconds: 60 * 60, // 1 hour
                maxEntries: 50,
              },
            },
            urlPattern: ({ url }) => {
              return url.href.startsWith("https://clerk.ethang.dev/");
            },
          },
        ],
        skipWaiting: true,
        sourcemap: false,
      },
    }),
  ],
});
