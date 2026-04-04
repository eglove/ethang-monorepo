import { config } from "@dotenvx/dotenvx";
import find from "lodash/find.js";

import { runPipeline } from "./index.ts";

config();

const topic = find(process.argv.slice(2), (a) => "--" !== a) ?? "pipeline";

globalThis.console.log(
  `[pipeline] Starting design pipeline… (topic: "${topic}")`,
);
const result = await runPipeline(topic);

globalThis.console.log(JSON.stringify(result, null, 2));
process.exitCode = result.success ? 0 : 1;
