/// <reference types="vitest/config" />
import { cloudflare } from "@cloudflare/vite-plugin";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
const dirname =
  "undefined" === typeof __dirname ? import.meta.dirname : __dirname;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig(({ mode }) => {
  return {
    plugins: [
      tanstackRouter({
        autoCodeSplitting: true,
        target: "react",
        verboseFileRoutes: false,
      }),
      react(),
      "test" !== mode && cloudflare(),
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
                return /\.(?:js|css|woff|woff2|ttf|otf|eot|ico)$/u.test(
                  url.href,
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
          ],
          skipWaiting: true,
          sourcemap: false,
        },
      }),
      tailwindcss(),
    ],
    server: {
      hmr: {
        overlay: false,
      },
    },
    test: {
      projects: [
        {
          extends: true,
          test: {
            environment: "jsdom",
            include: [
              "src/**/*.test.ts",
              "src/**/*.test.tsx",
              "worker/**/*.test.ts",
            ],
            name: "unit",
          },
        },
        {
          extends: true,
          plugins: [
            // The plugin will run tests for the stories defined in your Storybook config
            // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
            storybookTest({
              configDir: path.join(dirname, ".storybook"),
            }),
          ],
          test: {
            browser: {
              enabled: true,
              headless: true,
              instances: [
                {
                  browser: "chromium",
                },
              ],
              provider: playwright({}),
            },
            name: "storybook",
            setupFiles: [".storybook/vitest.setup.ts"],
          },
        },
      ],
    },
  };
});
