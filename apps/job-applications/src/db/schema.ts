import {
  integer,
  sqliteTable,
  text,
  uniqueIndex
} from "drizzle-orm/sqlite-core";
import { DateTime } from "effect";
import constant from "lodash/constant.js";
import { v7 } from "uuid";

export const generateId = () => {
  return v7();
};

// eslint-disable-next-line @typescript-eslint/no-deprecated, sonar/deprecation
export const jobApplicationsTable = sqliteTable(
  "job_applications",
  {
    applicationUrl: text("applicationUrl").notNull(),
    appliedDate: text("appliedDate").notNull(),
    company: text("company").notNull(),
    createdAt: text("createdAt")
      .notNull()
      .$defaultFn(() => {
        return DateTime.formatIso(DateTime.unsafeNow());
      }),
    email: text("email").notNull(),
    id: text("id").primaryKey().$defaultFn(generateId),
    location: text("location"),
    nextInterviewDate: text("nextInterviewDate"),
    notes: text("notes"),
    resumeFilename: text("resumeFilename"),
    resumeKey: text("resumeKey"),
    resumeSize: integer("resumeSize"),
    salary: text("salary"),
    status: text("status").notNull().$defaultFn(constant("applied")),
    title: text("title").notNull(),
    updatedAt: text("updatedAt")
      .notNull()
      .$defaultFn(() => {
        return DateTime.formatIso(DateTime.unsafeNow());
      })
  },
  (table) => {
    return {
      emailApplicationUrlUnique: uniqueIndex("email_application_url_unique").on(
        table.email,
        table.applicationUrl
      )
    };
  }
);
