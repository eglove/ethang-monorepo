import { bindings, defineConfig } from "cf/config";

/*
 * The wrangler preview_bucket_name (job-resumes-preview) has no equivalent in
 * the new config; local development uses cf's local resource simulation.
 */
export default defineConfig({
  worker: {
    compatibilityDate: "2026-09-21",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "src/index.ts",
    env: {
      jobApplications: bindings.d1({
        dev: {
          remote: true
        },
        id: "b069cc4a-ee0f-4ced-98f0-922b0e69dc48",
        name: "job-applications"
      }),
      jobResumes: bindings.r2({
        name: "job-resumes"
      })
    },
    name: "job-applications",
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
