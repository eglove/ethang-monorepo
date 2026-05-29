import { projectBuilder } from "@ethang/project-builder/project-builder.js";
import get from "lodash/get.js";

const root = get(import.meta, ["dirname"]);

await projectBuilder(root);
