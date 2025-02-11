import type { JobApplication } from "@/types/job-application.ts";

import { getJobApplicationsDatabase } from "@/database/indexed-database.ts";
import filter from "lodash/filter.js";
import isDate from "lodash/isDate.js";
import { v7 } from "uuid";

export const mutations = {
  addJobApplication: () => {
    return {
      mutationFn: async (application: Omit<JobApplication, "id">) => {
        const database = await getJobApplicationsDatabase();

        return database.add("jobApplications", {
          ...application,
          id: v7(),
          interviewRounds: [],
        });
      },
    };
  },
  deleteJobApplication: () => {
    return {
      mutationFn: async (id: string) => {
        const database = await getJobApplicationsDatabase();

        return database.delete("jobApplications", id);
      },
    };
  },
  updateJobApplication: () => {
    return {
      mutationFn: async (application: JobApplication) => {
        const database = await getJobApplicationsDatabase();

        return database.put("jobApplications", {
          ...application,
          interviewRounds: filter(application.interviewRounds, isDate),
        });
      },
    };
  },
};
