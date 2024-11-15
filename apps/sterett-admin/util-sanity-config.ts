import { codeInput } from "@sanity/code-input";
import { dashboardTool, projectUsersWidget } from "@sanity/dashboard";
import { visionTool } from "@sanity/vision";
import { structureTool } from "sanity/structure";

import { updateWidget } from "./dashboard/update.js";
import { deskStructure } from "./desk-structure.js";

const widgets = [
  updateWidget({ layout: { width: "medium" } }),
  projectUsersWidget({ layout: { width: "medium" } }),
];

export const developmentPlugins = [
  structureTool({
    structure: deskStructure,
  }),
  dashboardTool({
    title: "Updates",
    widgets,
  }),
  visionTool(),
  codeInput(),
];

export const productionPlugins = [
  structureTool({
    structure: deskStructure,
  }),
  dashboardTool({
    title: "Updates",
    widgets,
  }),
  codeInput(),
];
