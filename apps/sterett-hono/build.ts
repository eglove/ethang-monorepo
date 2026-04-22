import { buildServiceWorker } from "../../packages/service-worker/src/build.ts";

await buildServiceWorker("./public/sw.js");
