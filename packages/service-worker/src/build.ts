import * as esbuild from "esbuild";
import { randomUUID } from "node:crypto";
import path from "node:path";

const __dirname = import.meta.dirname;

export const buildServiceWorker = async (outfile: string) => {
  const swVersion = randomUUID().slice(0, 8);
  const swPath = path.resolve(__dirname, "sw.ts");

  await esbuild.build({
    bundle: true,
    define: {
      "process.env.SW_VERSION": JSON.stringify(swVersion),
    },
    entryPoints: [swPath],
    format: "esm",
    minify: true,
    outfile,
    target: "es2022",
    // Workbox needs this for certain environments
    conditions: ["worker", "browser"],
  });

  console.info(`Service worker built to ${outfile} with version ${swVersion}`);
};
