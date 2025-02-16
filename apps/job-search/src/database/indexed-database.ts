import type { JobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";

import { type DBSchema, openDB } from "idb";

export type QuestionAnswerSchema = {
  answer: string;
  id: string;
  question: string;
};

type LocalDatabaseSchema = {
  [JOB_APPLICATION_STORE_NAME]: {
    indexes: {
      applied: string;
      position: string[];
      url: string;
    };
    key: string;
    value: JobApplicationSchema;
  };
  [QUESTION_ANSWER_STORE_NAME]: {
    key: string;
    value: QuestionAnswerSchema;
  };
} & DBSchema;

export const LOCAL_DATABASE_VERSION = 1;
export const JOB_APPLICATION_STORE_NAME = "jobApplications";
export const QUESTION_ANSWER_STORE_NAME = "questionAnswers";

export const getDatabase = async () => {
  return openDB<LocalDatabaseSchema>(
    "job-application-db",
    LOCAL_DATABASE_VERSION,
    {
      upgrade(database) {
        const applicationStore = database.createObjectStore(
          JOB_APPLICATION_STORE_NAME,
          {
            autoIncrement: false,
            keyPath: "id",
          },
        );

        applicationStore.createIndex("url", "url", { unique: true });
        applicationStore.createIndex("position", ["title", "company"], {
          unique: true,
        });
        applicationStore.createIndex("applied", "applied");

        database.createObjectStore(QUESTION_ANSWER_STORE_NAME, {
          autoIncrement: false,
          keyPath: "id",
        });
      },
    },
  );
};
