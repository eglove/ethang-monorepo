import { Effect } from "effect";
import { build } from "esbuild";
import { randomUUID } from "node:crypto";
import path from "node:path";

const directoryName = import.meta.dirname;

export const buildServiceWorker = async (outfile: string) => {
  const swVersion = randomUUID().slice(0, 8);
  const swPath = path.resolve(directoryName, "public/sw.ts");

  await build({
    bundle: true,
    define: {
      "process.env.SW_VERSION": JSON.stringify(swVersion)
    },
    entryPoints: [swPath],
    format: "esm",
    minify: true,
    outfile,
    target: "es2022",
    // Workbox needs this for certain environments
    conditions: ["worker", "browser"]
  });

  Effect.runSync(
    Effect.logInfo(
      `Service worker built to ${outfile} with version ${swVersion}`
    )
  );
};

await buildServiceWorker("./public/sw.js");
