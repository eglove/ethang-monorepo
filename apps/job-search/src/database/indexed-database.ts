import { type DBSchema, openDB } from "idb";

type LocalDatabaseSchema = {
  jobApplications: {
    indexes: { applied: string; position: string[]; url: string };
    key: string;
    value: {
      applied: Date;
      company: string;
      id: string;
      interviewRounds?: Date[] | null;
      rejected?: Date | null;
      title: string;
      url: string;
    };
  };
} & DBSchema;

export const LOCAL_DATABASE_NAME = "job-application-db";
export const LOCAL_DATABASE_VERSION = 1;

export const getJobApplicationsDatabase = async () => {
  return openDB<LocalDatabaseSchema>(
    LOCAL_DATABASE_NAME,
    LOCAL_DATABASE_VERSION,
    {
      upgrade(database) {
        const store = database.createObjectStore("jobApplications", {
          autoIncrement: false,
          keyPath: "id",
        });

        store.createIndex("url", "url", { unique: true });
        store.createIndex("position", ["title", "company"], { unique: true });
        store.createIndex("applied", "applied");
      },
    },
  );
};
