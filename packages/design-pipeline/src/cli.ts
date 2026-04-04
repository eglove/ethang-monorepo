import { runPipeline } from "./index.ts";

const result = await runPipeline();

globalThis.console.log(JSON.stringify(result, null, 2));
process.exitCode = result.success ? 0 : 1;
