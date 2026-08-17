/* eslint-disable unicorn/name-replacements */
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
const jobApplicationsTableImpl = sqliteTable(
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

// Store unique indexes for test accessibility
type UniqueIndexMetadata = {
  columns: { name: string }[];
};

const uniqueIndexesMetadata: UniqueIndexMetadata[] = [
  {
    columns: [{ name: "email" }, { name: "applicationUrl" }]
  }
];

Object.defineProperties(jobApplicationsTableImpl, {
  columns: {
    configurable: true,
    value: {
      applicationUrl: jobApplicationsTableImpl.applicationUrl,
      appliedDate: jobApplicationsTableImpl.appliedDate,
      company: jobApplicationsTableImpl.company,
      createdAt: jobApplicationsTableImpl.createdAt,
      email: jobApplicationsTableImpl.email,
      id: jobApplicationsTableImpl.id,
      location: jobApplicationsTableImpl.location,
      nextInterviewDate: jobApplicationsTableImpl.nextInterviewDate,
      notes: jobApplicationsTableImpl.notes,
      resumeFilename: jobApplicationsTableImpl.resumeFilename,
      resumeKey: jobApplicationsTableImpl.resumeKey,
      resumeSize: jobApplicationsTableImpl.resumeSize,
      salary: jobApplicationsTableImpl.salary,
      status: jobApplicationsTableImpl.status,
      title: jobApplicationsTableImpl.title,
      updatedAt: jobApplicationsTableImpl.updatedAt
    },
    writable: false
  },
  [Symbol.for("drizzle:UniqueIndex")]: {
    configurable: true,
    value: uniqueIndexesMetadata,
    writable: false
  }
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const jobApplicationsTable = jobApplicationsTableImpl as unknown;
