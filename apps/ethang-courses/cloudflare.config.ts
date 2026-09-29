import { bindings, defineConfig } from "cf/config";

export default defineConfig({
  worker: {
    cache: {
      enabled: true
    },
    compatibilityDate: "2026-09-21",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "src/index.ts",
    env: {
      ethang_courses: bindings.d1({
        dev: {
          remote: true
        },
        id: "7930072d-1d49-4e57-a100-ac95e7916ac7",
        name: "ethang-courses"
      })
    },
    name: "ethang-courses",
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
