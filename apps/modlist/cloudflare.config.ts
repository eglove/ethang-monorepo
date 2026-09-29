import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    compatibilityDate: "2026-09-21",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "src/index.ts",
    env: {
      ethang_modlist: bindings.d1({
        dev: {
          remote: true
        },
        id: "PLACEHOLDER",
        name: "modlist"
      })
    },
    name: "modlist",
    observability: {
      enabled: true,
      headSamplingRate: 1
    },
    placement: {
      mode: "smart"
    },
    workersDev: false
  }
});
