/* v8 ignore start -- entry point: exercised as a subprocess in bin.test.ts */
import { parseAndExecute } from "./engine/pipeline-runner.js";

const result = await parseAndExecute(process.argv.slice(2));

if (result.stdout) process.stdout.write(`${result.stdout}\n`);
if (result.stderr) process.stderr.write(`${result.stderr}\n`);
process.exitCode = result.exitCode;
/* v8 ignore stop */
