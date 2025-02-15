import {
  getJobApplicationsDatabase,
  getQuestionAnswerDatabase,
  JOB_APPLICATION_STORE_NAME,
  type JobApplicationSchema,
  QUESTION_ANSWER_STORE_NAME,
  type QuestionAnswerSchema,
} from "@/database/indexed-database.ts";
import filter from "lodash/filter.js";
import isDate from "lodash/isDate.js";
import { v7 } from "uuid";

export const mutations = {
  addJobApplication: () => {
    return {
      mutationFn: async (application: Omit<JobApplicationSchema, "id">) => {
        const database = await getJobApplicationsDatabase();

        return database.add(JOB_APPLICATION_STORE_NAME, {
          ...application,
          id: v7(),
          interviewRounds: [],
        });
      },
    };
  },
  addQa: () => {
    return {
      mutationFn: async (qa: Omit<QuestionAnswerSchema, "id">) => {
        const database = await getQuestionAnswerDatabase();

        return database.add(QUESTION_ANSWER_STORE_NAME, {
          ...qa,
          id: v7(),
        });
      },
    };
  },
  deleteJobApplication: () => {
    return {
      mutationFn: async (id: string) => {
        const database = await getJobApplicationsDatabase();

        return database.delete(JOB_APPLICATION_STORE_NAME, id);
      },
    };
  },
  deleteQa: () => {
    return {
      mutationFn: async (id: string) => {
        const database = await getQuestionAnswerDatabase();

        return database.delete(QUESTION_ANSWER_STORE_NAME, id);
      },
    };
  },
  updateJobApplication: () => {
    return {
      mutationFn: async (application: JobApplicationSchema) => {
        const database = await getJobApplicationsDatabase();

        return database.put(JOB_APPLICATION_STORE_NAME, {
          ...application,
          interviewRounds: filter(application.interviewRounds, isDate),
        });
      },
    };
  },
  updateQa: () => {
    return {
      mutationFn: async (qa: QuestionAnswerSchema) => {
        const database = await getQuestionAnswerDatabase();

        return database.put(QUESTION_ANSWER_STORE_NAME, qa);
      },
    };
  },
};
