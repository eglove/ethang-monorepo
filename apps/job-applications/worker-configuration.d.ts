interface __BaseEnv_Env {
  jobApplications: D1Database;
  jobResumes: R2Bucket;
  "token-auth": string;
}
declare namespace Cloudflare {
  interface Env extends __BaseEnv_Env {}
}
interface Env extends __BaseEnv_Env {}
