import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
  type JobApplicationSchema,
  QUESTION_ANSWER_STORE_NAME,
  type QuestionAnswerSchema,
} from "@/database/indexed-database.ts";
import filter from "lodash/filter.js";
import isDate from "lodash/isDate.js";
import { v7 } from "uuid";

export const mutationMetaTypes = {
  addApplication: "addApplication",
  addQa: "addQa",
  deleteApplication: "deleteApplication",
  deleteQa: "deleteQa",
  updateApplication: "updateApplication",
  updateQa: "updateQa",
} as const;

export const mutations = {
  addJobApplication: () => {
    return {
      meta: { type: mutationMetaTypes.addApplication },
      mutationFn: async (application: Omit<JobApplicationSchema, "id">) => {
        const database = await getDatabase();

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
      meta: { type: mutationMetaTypes.addQa },
      mutationFn: async (qa: Omit<QuestionAnswerSchema, "id">) => {
        const database = await getDatabase();

        return database.add(QUESTION_ANSWER_STORE_NAME, {
          ...qa,
          id: v7(),
        });
      },
    };
  },
  deleteJobApplication: () => {
    return {
      meta: { type: mutationMetaTypes.deleteApplication },
      mutationFn: async (id: string) => {
        const database = await getDatabase();

        return database.delete(JOB_APPLICATION_STORE_NAME, id);
      },
    };
  },
  deleteQa: () => {
    return {
      meta: { type: mutationMetaTypes.deleteQa },
      mutationFn: async (id: string) => {
        const database = await getDatabase();

        return database.delete(QUESTION_ANSWER_STORE_NAME, id);
      },
    };
  },
  updateJobApplication: () => {
    return {
      meta: { type: mutationMetaTypes.updateApplication },
      mutationFn: async (application: JobApplicationSchema) => {
        const database = await getDatabase();

        return database.put(JOB_APPLICATION_STORE_NAME, {
          ...application,
          interviewRounds: filter(application.interviewRounds, isDate),
        });
      },
    };
  },
  updateQa: () => {
    return {
      meta: { type: mutationMetaTypes.updateQa },
      mutationFn: async (qa: QuestionAnswerSchema) => {
        const database = await getDatabase();

        return database.put(QUESTION_ANSWER_STORE_NAME, qa);
      },
    };
  },
};
