/**
IO wrapper around the pure `coverage-summary` domain parser.

Given a path to a vitest-generated `coverage-summary.json`, this
module reads the file and decodes it via
`parseCoverageSummary`. Any IO error is wrapped in a domain
`Error` so the app layer can surface it as a workspace
failure without importing `node:fs` directly.
*/

import { readFileSync } from "node:fs";

import { parseCoverageSummary } from "../domain/coverage-summary.ts";

export type ReadCoverageSummaryOptions = {
  encoding?: BufferEncoding;
  filePath: string;
};

export const readCoverageSummary = (options: ReadCoverageSummaryOptions) => {
  const encoding = options.encoding ?? "utf8";
  const raw = readFileSync(options.filePath, encoding);
  return parseCoverageSummary(raw);
};
