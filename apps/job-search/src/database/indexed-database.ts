import { type DBSchema, openDB } from "idb";

export type JobApplicationSchema = {
  applied: Date;
  company: string;
  id: string;
  interviewRounds?: Date[] | null;
  rejected?: Date | null;
  title: string;
  url: string;
};

export type QuestionAnswerSchema = {
  answer: string;
  id: string;
  question: string;
};

type LocalDatabaseSchema = {
  jobApplications: {
    indexes: {
      applied: string;
      position: string[];
      url: string;
    };
    key: string;
    value: JobApplicationSchema;
  };
} & DBSchema;

type QuestionAnswerDatabaseSchema = {
  key: string;
  value: QuestionAnswerSchema;
};

export const LOCAL_DATABASE_VERSION = 1;

export const JOB_APPLICATION_STORE_NAME = "jobApplications";
export const getJobApplicationsDatabase = async () => {
  return openDB<LocalDatabaseSchema>(
    "job-application-db",
    LOCAL_DATABASE_VERSION,
    {
      upgrade(database) {
        const store = database.createObjectStore(JOB_APPLICATION_STORE_NAME, {
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

export const QUESTION_ANSWER_STORE_NAME = "questionAnswers";
export const getQuestionAnswerDatabase = async () => {
  return openDB<QuestionAnswerDatabaseSchema>(
    "question-answer-db",
    LOCAL_DATABASE_VERSION,
    {
      upgrade(database) {
        database.createObjectStore(QUESTION_ANSWER_STORE_NAME, {
          autoIncrement: false,
          keyPath: "id",
        });
      },
    },
  );
};
