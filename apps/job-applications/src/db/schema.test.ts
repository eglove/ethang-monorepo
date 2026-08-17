import { Column, getTableColumns } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import { jobApplicationsTable as jobAppsTable } from "./schema.ts";

describe("jobApplicationsTable", () => {
  it("defines the expected columns", () => {
    const columns = getTableColumns(jobAppsTable);
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

  it("defines the unique (email, applicationUrl) index matching migration SQL", () => {
    const { indexes } = getTableConfig(jobAppsTable);
    const uniqueIndex = indexes.find((index) => {
      return "email_application_url_unique" === index.config.name;
    });
    expect(uniqueIndex).toBeDefined();
    expect(uniqueIndex?.config.unique).toBe(true);
    const colNames = map(uniqueIndex?.config.columns, (col) => {
      return col instanceof Column ? col.name : null;
    });
    expect(colNames).toEqual(["email", "applicationUrl"]);
  });
});
