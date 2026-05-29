import { projectBuilder } from "@ethang/project-builder/project-builder.js";
import { dirname } from "path";
import { fileURLToPath } from "url";

const root = dirname(fileURLToPath(import.meta.url));

await projectBuilder(root);
