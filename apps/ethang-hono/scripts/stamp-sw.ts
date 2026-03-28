import replace from "lodash/replace.js";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const swPath = fileURLToPath(new URL("../public/sw.js", import.meta.url));
const content = readFileSync(swPath, "utf8");

const withoutVersion = replace(content, /^const SW_VERSION = ".*";$/mu, "");
const hash = createHash("sha256")
  .update(withoutVersion)
  .digest("hex")
  .slice(0, 8);

const stamped = replace(
  content,
  /^const SW_VERSION = ".*";$/mu,
  `const SW_VERSION = "${hash}";`,
);

writeFileSync(swPath, stamped);
globalThis.console.log(`SW stamped: ${hash}`);

const deployInfoPath = fileURLToPath(
  new URL("../src/utilities/deploy-info.ts", import.meta.url),
);
const deployTime = new Date().toISOString();
writeFileSync(
  deployInfoPath,
  `export const DEPLOY_TIME = "${deployTime}";\n`,
);
globalThis.console.log(`Deploy time stamped: ${deployTime}`);
