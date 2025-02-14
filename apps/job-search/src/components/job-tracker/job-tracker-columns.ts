import type { JobApplicationSchema } from "@/database/indexed-database.ts";

import isNil from "lodash/isNil";
import times from "lodash/times";

export const getApplicationTableColumns = (
  data: JobApplicationSchema[] | undefined,
) => {
  if (isNil(data)) {
    return [
      { key: "title", label: "Title" },
      { key: "company", label: "Company" },
      { key: "url", label: "URL" },
      { key: "applied", label: "Applied" },
      { key: "rejected", label: "Rejected" },
      { key: "actions", label: "Actions" },
    ];
  }

  let maxRounds = 0;
  for (const datum of data) {
    maxRounds = Math.max(maxRounds, datum.interviewRounds?.length ?? 0);
  }

  return [
    { key: "title", label: "Title" },
    { key: "company", label: "Company" },
    { key: "url", label: "URL" },
    { key: "applied", label: "Applied" },
    ...times(maxRounds, (round) => {
      return { key: `round-${round + 1}`, label: `Round ${round + 1}` };
    }),
    { key: "rejected", label: "Rejected" },
    { key: "actions", label: "Actions" },
  ];
};
