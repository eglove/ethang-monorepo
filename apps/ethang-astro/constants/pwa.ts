import type { PwaOptions } from "@vite-pwa/astro";

export const pwaManifest = {
  background_color: "#011627",
  description:
    "Ethan Glover — software engineer and builder. Essays, courses, and tips on resilient software, complex domains, and systems that stay easy to change.",
  display: "standalone" as const,
  icons: [
    {
      sizes: "64x64",
      src: "pwa-64x64.png",
      type: "image/png"
    },
    {
      sizes: "192x192",
      src: "pwa-192x192.png",
      type: "image/png"
    },
    {
      sizes: "512x512",
      src: "pwa-512x512.png",
      type: "image/png"
    },
    {
      purpose: "maskable",
      sizes: "512x512",
      src: "maskable-icon-512x512.png",
      type: "image/png"
    }
  ],
  name: "Ethan Glover",
  short_name: "EthanG",
  start_url: "/",
  theme_color: "#011627"
};

export const PWA_MANIFEST_PATH = "/manifest.webmanifest";

export const PWA_APPLE_TOUCH_ICON_PATH = "/apple-touch-icon-180x180.png";

export const pwaOptions: PwaOptions = {
  devOptions: { enabled: true },
  manifest: pwaManifest,
  outDir: "dist/client",
  registerType: "autoUpdate"
};
