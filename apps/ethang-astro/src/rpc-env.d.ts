// RPC bindings typed from sibling declaration outputs (see src/lib/rpc-typegen.ts).
// Import-free so this file stays a global script and merges with the generated types.
declare namespace Cloudflare {
  interface Env {
    ethang_courses: Service<typeof import("../../ethang-courses/dist-types/src/index").default>;
    ethang_rss: Service<typeof import("../../ethang-rss/dist-types/src/index").default>;
    job_applications: Service<typeof import("../../job-applications/dist-types/src/index").default>;
  }
}
