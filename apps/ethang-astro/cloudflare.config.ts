import { bindings, defineConfig } from "cf/config";

/*
 * Static assets are served by the @astrojs/cloudflare adapter through the
 * Cloudflare Vite plugin; the ASSETS binding stays available to the worker.
 */
export default defineConfig({
  worker: {
    compatibilityDate: "2026-09-21",
    compatibilityFlags: ["global_fetch_strictly_public"],
    domains: ["ethang.dev", "www.ethang.dev"],
    entrypoint: "@astrojs/cloudflare/entrypoints/server",
    env: {
      ASSETS: bindings.assets(),
      ethang_courses: bindings.worker({
        worker: "ethang-courses"
      }),
      ethang_rss: bindings.worker({
        worker: "ethang-rss"
      }),
      job_applications: bindings.worker({
        worker: "job-applications"
      })
    },
    name: "ethang-astro",
    observability: {
      enabled: true
    },
    placement: {
      mode: "smart"
    }
  }
});
