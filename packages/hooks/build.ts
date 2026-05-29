import { projectBuilder } from "@ethang/project-builder/project-builder.js";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(fileURLToPath(import.meta.url));

await projectBuilder(root);
