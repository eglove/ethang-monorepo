import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../../define.ts";
import { webstormMcpDatabase } from "./database.ts";
import { webstormMcpFileOperations } from "./file-operations.ts";
import { webstormMcpProjectBuild } from "./project-build.ts";
import { webstormMcpRefactoringInspection } from "./refactoring-inspection.ts";
import { webstormMcpSearchNavigation } from "./search-navigation.ts";
import { webstormMcpTableOfContents } from "./table-of-contents.ts";

export const webstormMcp = defineSkill({
  content: [
    {
      level: 1,
      text: "WebStorm MCP Skill Guide",
      type: "header"
    },
    {
      text: "This skill provides an overview of the tools available via the WebStorm MCP server. It is organized by category to help you easily find the right tool for your task.",
      type: "text"
    },
    ...webstormMcpTableOfContents,
    ...webstormMcpFileOperations,
    ...webstormMcpSearchNavigation,
    ...webstormMcpRefactoringInspection,
    ...webstormMcpProjectBuild,
    ...webstormMcpDatabase
  ] as MarkdownBlock[],
  description:
    "Explains how to use the WebStorm MCP, including available tools, parameters, and examples for complex tools.",
  name: "webstorm-mcp"
});
