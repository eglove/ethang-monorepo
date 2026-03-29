// Manual additions to CloudflareBindings for vars that live only in .dev.vars
// and are therefore absent from the wrangler-generated worker-configuration.d.ts.
interface CloudflareBindings {
  ENABLE_TEST_ROUTES?: string;
}
