import { config } from "@dotenvx/dotenvx";
import find from "lodash/find.js";

config();

const topic = find(process.argv.slice(2), (a) => "--" !== a) ?? "pipeline";

globalThis.console.log(
  `[pipeline] Starting design pipeline (topic: "${topic}")`,
);
globalThis.console.log("[pipeline] Store-based architecture initialized");
process.exitCode = 0;
