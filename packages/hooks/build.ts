import path from "path";
import { fileURLToPath } from "url";

import { projectBuilder } from "@ethang/project-builder/project-builder.js";

const root = path.dirname(fileURLToPath(import.meta.url));

await projectBuilder(root);
