import type { JobApplicationSchema } from "@ethang/schemas/src/job-search/job-application-schema.ts";
import type { QuestionAnswerSchema } from "@ethang/schemas/src/job-search/question-answer-schema.ts";

import { queryClient } from "@/components/common/providers.tsx";
import { userStore } from "@/components/stores/user-store.ts";
import { queries } from "@/data/queries.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { backupAllData } from "@/lib/sync-requests.ts";
import filter from "lodash/filter.js";
import get from "lodash/get";
import isNil from "lodash/isNil";

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
      mutationFn: async (application: JobApplicationSchema) => {
        const database = await getDatabase();

        return database.add(JOB_APPLICATION_STORE_NAME, {
          ...application,
          interviewRounds: [],
        });
      },
    };
  },
  addQa: () => {
    return {
      meta: { type: mutationMetaTypes.addQa },
      mutationFn: async (qa: QuestionAnswerSchema) => {
        const database = await getDatabase();

        return database.add(QUESTION_ANSWER_STORE_NAME, qa);
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
  signIn: () => {
    return {
      mutationFn: async (value: { email: string; password: string }) => {
        const response = await globalThis.fetch(
          "https://auth.ethang.dev/sign-in",
          {
            body: JSON.stringify(value),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to sign in.");
        }

        const data = await response.json();
        userStore.set((state) => {
          state.isSignedIn = true;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          state.token = get(data, ["token"], "") as unknown as string;
        });
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: queries.getApplications(),
          }),
          queryClient.invalidateQueries({ queryKey: queries.getQas() }),
          backupAllData(),
        ]);
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
          interviewRounds: filter(
            application.interviewRounds,
            (value) => !isNil(value),
          ),
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
