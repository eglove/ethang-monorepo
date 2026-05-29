import { projectBuilder } from "@ethang/project-builder/project-builder.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

await projectBuilder(root);
