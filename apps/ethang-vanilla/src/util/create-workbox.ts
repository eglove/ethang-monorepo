import { generateSW } from "workbox-build";

export const createWorkbox = async () => {
  await generateSW({
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    globDirectory: "./dist",
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
            maxAgeSeconds: 30 * 24 * 60 * 60,
            maxEntries: 50,
          },
        },
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/u,
      },
      {
        handler: "NetworkFirst",
        options: {
          cacheName: "html-cache",
        },
        urlPattern: /\.html$/u,
      },
    ],
    skipWaiting: true,
    sourcemap: false,
    swDest: "./dist/service-worker.js",
  });
};
