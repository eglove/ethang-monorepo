/**
Pure parser for vitest's `coverage-summary.json` file.

The shape we receive is what vitest writes when the
`--coverage` reporter is enabled. The summary root has metrics for
lines/branches/functions/statements plus a nested object per metric
with `pct` (percentage covered), `covered`, and `total` counts.
*/

import { Effect, Schema } from "effect";

const METRIC_KEYS = ["branches", "functions", "lines", "statements"] as const;

const CoverageMetricSchema = Schema.Struct({
  covered: Schema.Number,
  pct: Schema.Number,
  total: Schema.Number
});

const CoverageSummarySchema = Schema.Struct({
  branches: CoverageMetricSchema,
  functions: CoverageMetricSchema,
  lines: CoverageMetricSchema,
  statements: CoverageMetricSchema
});

export type CoverageSummary = Schema.Schema.Type<typeof CoverageSummarySchema>;

const CoverageFileSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Unknown
});

const decodeSummary = (raw: string) => {
  return Effect.runSync(
    Schema.decodeUnknown(Schema.parseJson(CoverageFileSchema))(raw).pipe(
      Effect.flatMap((file) => {
        return Schema.decodeUnknown(CoverageSummarySchema)(
          file["total"] ?? file
        );
      }),
      Effect.mapError((error) => {
        return new Error(`coverage-summary: ${String(error)}`);
      })
    )
  );
};

export const parseCoverageSummary = (raw: string) => {
  return decodeSummary(raw);
};

export const summarizeCoverage = (summary: CoverageSummary) => {
  let covered = 0;
  let total = 0;
  for (const key of METRIC_KEYS) {
    covered += summary[key].covered;
    total += summary[key].total;
  }
  return { covered, total };
};
