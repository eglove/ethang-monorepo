type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  type Locals = {} & Runtime;
}
