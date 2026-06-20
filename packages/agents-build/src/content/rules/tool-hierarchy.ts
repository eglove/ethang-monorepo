import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";
import { defineRule } from "../../define.ts";

const contentBlocks: MarkdownBlock[] = [
  { level: 1, text: "Tool Usage Hierarchy", type: "header" },
  {
    text: "This repository strictly enforces a hierarchy of tools for all AI agents. Native execution of arbitrary scripts or fallback tools must be avoided if specialized tools exist.",
    type: "text"
  },
  { level: 2, text: "1. Primary Toolset: codebase-memory-mcp", type: "header" },
  {
    text: "The codebase-memory-mcp is the TOP PRIORITY for everything it supports. You must use its tools whenever applicable.",
    type: "text"
  },
  {
    items: [
      { text: "`search_graph`" },
      { text: "`trace_path`" },
      { text: "`get_code_snippet`" },
      { text: "`query_graph`" },
      { text: "`get_architecture`" }
    ],
    type: "unorderedList"
  },
  { level: 2, text: "2. Secondary Toolset: webstorm-mcp", type: "header" },
  {
    text: "For anything not covered by codebase-memory-mcp, use webstorm-mcp.\nThis includes:",
    type: "text"
  },
  {
    items: [
      { text: "Writing, creating, and renaming files" },
      { text: "Refactoring codebase elements" },
      { text: "Project builds and execution" },
      { text: "Database searches and SQL queries" }
    ],
    type: "unorderedList"
  },
  {
    level: 2,
    text: "3. Fallback: PowerShell & Specialized CLIs",
    type: "header"
  },
  {
    text: "If the MCP tools cannot fulfill the requirement, use PowerShell as a fallback.\n**BASH IS STRICTLY BANNED.** Do not use bash (including Git Bash, WSL, or bash.exe) for any operations.\nWithin PowerShell, leverage available specialized CLIs:",
    type: "text"
  },
  {
    items: [
      {
        text: "`/ripgrep` (rg) for searching text (Preferred when searching outside the repo)"
      },
      { text: "`/jq` for processing and reading JSON files" },
      {
        text: "`/everything-search` (es) for fast file lookups (Preferred when searching outside the repo)"
      },
      { text: "`/github-cli` (gh) for git management" },
      { text: "`/sara-cli` for tracing requirements" }
    ],
    type: "unorderedList"
  },
  { level: 2, text: "4. Banned Native Tools", type: "header" },
  {
    text: "The following native actions are restricted by a PreToolUse hook and must be redirected to their webstorm-mcp, codebase-memory-mcp, or CLI equivalents:",
    type: "text"
  },
  {
    items: [
      {
        text: "**Bash is STRICTLY BANNED.** You must not use bash under any circumstances."
      },
      {
        text: "`replace_file_content` / `multi_replace_file_content` / `write_to_file` (must use webstorm-mcp for writes/edits if possible)"
      },
      {
        text: "`view_file` / `read_file` (must use codebase-memory-mcp or webstorm-mcp)"
      },
      { text: "`list_dir` (use webstorm-mcp list_directory_tree)" },
      {
        text: "`find_by_name` (use webstorm-mcp find_files_by_name_keyword or /everything-search)"
      },
      {
        text: "`grep_search` (use codebase-memory-mcp, webstorm-mcp search tools, or /ripgrep)"
      }
    ],
    type: "unorderedList"
  }
];

export const toolHierarchy = defineRule({
  content: contentBlocks,
  filename: "tool-hierarchy",
  trigger: "always_on"
});
