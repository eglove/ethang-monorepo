import { bindings, defineConfig, exports, triggers } from "cf/config";

const WORKER_NAME = "ethang-rss";

export default defineConfig({
  worker: {
    cache: {
      enabled: true
    },
    compatibilityDate: "2026-09-21",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "src/index.ts",
    env: {
      ethang_rss: bindings.d1({
        dev: {
          remote: true
        },
        id: "14ad1254-859f-406b-a6af-fc02c6f75b2f",
        name: WORKER_NAME
      }),
      FETCH_FEEDS_WORKFLOW: bindings.workflow({
        exportName: "FetchFeedsWorkflow",
        name: "fetch-feeds-workflow",
        worker: WORKER_NAME
      })
    },
    exports: {
      FetchFeedsWorkflow: exports.workflow({
        name: "fetch-feeds-workflow"
      })
    },
    name: WORKER_NAME,
    observability: {
      enabled: true,
      headSamplingRate: 1
    },
    placement: {
      mode: "smart"
    },
    triggers: [
      triggers.scheduled({
        schedule: "*/15 * * * *"
      })
    ],
    workersDev: false
  }
});
