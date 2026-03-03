import { copyFileSync } from "node:fs";

import { buildScripts } from "./build-utilities.ts";

await buildScripts();

const assets = [
  {
    dest: "public/scripts/flowbite/flowbite.min.js",
    src: "node_modules/flowbite/dist/flowbite.min.js",
  },
  {
    dest: "public/scripts/flowbite/flowbite.min.js.map",
    src: "node_modules/flowbite/dist/flowbite.min.js.map",
  },
];

for (const asset of assets) {
  copyFileSync(asset.src, asset.dest);
}
