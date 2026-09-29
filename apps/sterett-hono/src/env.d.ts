// Manual additions to Env for vars that live only in .dev.vars and are
// therefore absent from the cf-generated .cloudflare/types/index.d.ts.
declare namespace Cloudflare {
  interface Env {
    ENABLE_TEST_ROUTES?: string;
  }
}