import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const saraCli = defineSkill({
  content: [
    {
      level: 1,
      text: "SARA CLI Skill Guide",
      type: "header"
    },
    {
      text: "SARA is a Requirements and Design Traceability CLI tool used within this workspace. It manages system and software requirements, ensuring they trace correctly to design files and implementation code.",
      type: "text"
    },
    {
      text: "[!IMPORTANT]\nWithin this workspace, use `sara` directly for requirements and design traceability operations (e.g., `sara check`).",
      type: "quote"
    },
    {
      level: 2,
      text: "Table of Contents",
      type: "header"
    },
    {
      items: [
        {
          text: "[Validation and Integrity](#validation-and-integrity)\n- [Check Graph Integrity](#check-graph-integrity)"
        },
        {
          text: "[Reporting](#reporting)\n- [Generate Coverage Report](#generate-coverage-report)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "Validation and Integrity",
      type: "header"
    },
    {
      level: 3,
      text: "Check Graph Integrity",
      type: "header"
    },
    {
      text: "Validates the requirements and design graph. This ensures that all requirements trace correctly to design files and implementations, and that there are no broken links or missing traces.\n**Example Usage:**",
      type: "text"
    },
    {
      code: "sara check",
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Reporting",
      type: "header"
    },
    {
      level: 3,
      text: "Generate Coverage Report",
      type: "header"
    },
    {
      text: "Generates a coverage report detailing the traceability from requirements down to the implementation layer.\n**Example Usage:**",
      type: "text"
    },
    {
      code: "sara report\n``\n\n## CLI Help Reference\n\n\n\n\n```text\nCLI for Sara - Requirements data graph\n\nUsage: sara.exe [OPTIONS] <COMMAND>\n\nCommands:\n  check   Parse documents, build data graph, and validate integrity\n  diff    Compare graphs between Git references\n  edit    Edit existing document metadata by item ID (interactive mode if no flags provided)\n  init    Initialize metadata in a Markdown file\n  query   Query items and traceability chains\n  report  Generate coverage and traceability reports\n  schema  Export the active model schema as YAML\n\nGlobal Options:\n  -c, --config <CONFIG>          Path to configuration file [default: sara.toml]\n  -h, --help                     Print help\n      --no-color                 Disable colored output\n      --no-emoji                 Disable emoji output\n  -q, --quiet                    Suppress all output except errors\n  -v, --verbose...               Increase verbosity (-v, -vv, -vvv)\n  -r, --repository <REPOSITORY>  Additional repository paths\n  -V, --version                  Print version\n",
      language: "bash",
      type: "codeBlock"
    }
  ] as MarkdownBlock[],
  description:
    "Explains how to use the SARA CLI to manage requirements and validate design traceability.",
  name: "sara-cli"
});
