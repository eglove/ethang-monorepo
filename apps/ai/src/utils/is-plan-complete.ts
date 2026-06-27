import includes from "lodash/includes.js";

export function isPlanComplete(content: string): boolean {
  return includes(content, "# Plan") && includes(content, "## ");
}
