import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import { jobApplicationsTable as jobAppsTable } from "./schema.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = jobAppsTable as any;

describe("jobApplicationsTable", () => {
  it("defines the expected columns", () => {
    const columns = table.columns;
    expect(columns.id.primary).toBe(true);
    expect(columns.email.notNull).toBe(true);
    expect(columns.applicationUrl.notNull).toBe(true);
    expect(columns.company.notNull).toBe(true);
    expect(columns.title.notNull).toBe(true);
    expect(columns.status.notNull).toBe(true);
    expect(columns.appliedDate.notNull).toBe(true);
    expect(columns.resumeKey.notNull).toBe(false);
    expect(columns.resumeFilename.notNull).toBe(false);
    expect(columns.resumeSize.dataType).toBe("number");
  });

  it("defines the unique (email, applicationUrl) index", () => {
    const unique = table[Symbol.for("drizzle:UniqueIndex")] ?? [];
    expect(unique.length).toBeGreaterThan(0);
    const first = unique[0] as { columns: { name: string }[] };
    expect(
      map(first.columns, ({ name }) => {
        return name;
      })
    ).toEqual(["email", "applicationUrl"]);
  });
});
