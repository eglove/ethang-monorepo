import { queryOptions } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import forEach from "lodash/forEach";
import isNil from "lodash/isNil";
import map from "lodash/map";
import sortBy from "lodash/sortBy";
import { DateTime } from "luxon";

import type { Job } from "./job";

import { NO_DRAFTS, sanityClient } from "../clients/sanity";
import { queryKeys } from "./query-keys";

export const experienceQuery = () => {
  return queryOptions({
    async queryFn() {
      const jobs: Job[] = await sanityClient.fetch(`*[_type == "job" && ${NO_DRAFTS}] | order(startDate desc) {
          ...,
          "techUsed": techUsed[]->,
          "methodologiesUsed": methodologiesUsed[]->,
        }`);

      const skills = new Map<string, number>();
      let max = new BigNumber(0);

      forEach(jobs, (job) => {
        const startDate = DateTime.fromJSDate(new Date(job.startDate));
        const endDate = DateTime.fromJSDate(isNil(job.endDate)
          ? new Date()
          : new Date(job.endDate));
        const diff = endDate.diff(startDate, "years").years;
        max = max.plus(diff);

        forEach(job.techUsed, (tech) => {
          if (skills.has(tech.name)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const current = skills.get(tech.name)!;
            const added = new BigNumber(current).plus(diff);
            skills.set(tech.name, added.toNumber());
          } else {
            skills.set(tech.name, diff);
          }
        });

        forEach(job.methodologiesUsed, (item) => {
          if (skills.has(item.name)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const current = skills.get(item.name)!;
            const added = new BigNumber(current).plus(diff);
            skills.set(item.name, added.toNumber());
          } else {
            skills.set(item.name, diff);
          }
        });
      });

      const values = map([...skills], ([name, experience]) => {
        return {
          experience,
          name,
        };
      });

      const sorted = sortBy(values, "experience").reverse();

      return {
        max,
        skills: sorted,
      };
    },
    queryKey: [...queryKeys.experience(), NO_DRAFTS],
  });
};
