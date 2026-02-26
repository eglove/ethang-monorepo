import { copyFileSync } from "node:fs";

copyFileSync(
  "node_modules/flowbite/dist/flowbite.min.js",
  "public/scripts/flowbite/flowbite.min.js",
);

copyFileSync(
  "node_modules/flowbite/dist/flowbite.min.js.map",
  "public/scripts/flowbite/flowbite.min.js.map",
);
