import isNil from "lodash/isNil.js";
import fs from "node:fs";
import path from "node:path";

import type { TestResults } from "./results-type.js";

type Stats = Record<
  string,
  {
    methods: Record<
      string,
      {
        passRate: number;
        totalPassed: number;
        totalTests: number;
      }
    >;
    passRate: number;
    totalPassed: number;
    totalTests: number;
  }
>;

const stats: Stats = {};

const jsonData: TestResults = JSON.parse(
  // @ts-expect-error ignore
  fs.readFileSync(path.join(import.meta.dirname, "results.json")),
);

for (const testResult of jsonData.testResults) {
  for (const assertionResult of testResult.assertionResults) {
    const [method, library] = assertionResult.ancestorTitles;

    if (isNil(stats[library])) {
      stats[library] = {
        methods: { [method]: { passRate: 0, totalPassed: 0, totalTests: 0 } },
        passRate: 0,
        totalPassed: 0,
        totalTests: 0,
      };
    }

    if (isNil(stats[library].methods[method])) {
      stats[library].methods[method] = {
        passRate: 0,
        totalPassed: 0,
        totalTests: 0,
      };
    }

    stats[library].totalTests += 1;
    stats[library].methods[method].totalTests += 1;

    if ("passed" === assertionResult.status) {
      stats[library].totalPassed += 1;
      stats[library].methods[method].totalPassed += 1;
    }

    stats[library].passRate =
      stats[library].totalPassed / stats[library].totalTests;
    stats[library].methods[method].passRate =
      stats[library].methods[method].totalPassed /
      stats[library].methods[method].totalTests;
  }
}

fs.writeFileSync(
  path.join(import.meta.dirname, "stats.json"),
  JSON.stringify(stats, null, 2),
);
