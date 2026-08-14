import { describe, expect, it } from "vitest";

import {
  PWA_APPLE_TOUCH_ICON_PATH,
  PWA_MANIFEST_PATH,
  pwaManifest,
  pwaOptions
} from "./pwa.ts";

describe("pwa manifest", () => {
  it("identifies the site with the Night Owl palette", () => {
    expect(pwaManifest).toMatchObject({
      background_color: "#011627",
      display: "standalone",
      name: "Ethan Glover",
      short_name: "EthanG",
      start_url: "/",
      theme_color: "#011627"
    });
  });

  it("describes the site for install prompts", () => {
    expect(pwaManifest.description).toContain("Ethan Glover");
    expect(pwaManifest.description).toContain("software engineer");
  });

  it("includes all required PWA icons", () => {
    expect(pwaManifest.icons).toEqual([
      { sizes: "64x64", src: "pwa-64x64.png", type: "image/png" },
      { sizes: "192x192", src: "pwa-192x192.png", type: "image/png" },
      { sizes: "512x512", src: "pwa-512x512.png", type: "image/png" },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "maskable-icon-512x512.png",
        type: "image/png"
      }
    ]);
  });
});

describe("pwa asset paths", () => {
  it("serves the web manifest from the site root", () => {
    expect(PWA_MANIFEST_PATH).toBe("/manifest.webmanifest");
  });

  it("serves the apple touch icon", () => {
    expect(PWA_APPLE_TOUCH_ICON_PATH).toBe("/apple-touch-icon-180x180.png");
  });
});

describe("pwa options", () => {
  it("uses the auto-update service worker strategy", () => {
    expect(pwaOptions.registerType).toBe("autoUpdate");
  });

  it("targets the client dist directory for service worker emission", () => {
    expect(pwaOptions.outDir).toBe("dist/client");
  });

  it("serves the manifest and service worker during development", () => {
    expect(pwaOptions.devOptions).toEqual({ enabled: true });
  });

  it("shares the manifest with the integration", () => {
    expect(pwaOptions.manifest).toBe(pwaManifest);
  });
});
