import { ComputeEngine } from "@cortex-js/compute-engine";
import concat from "lodash/concat.js";
import find from "lodash/find.js";
import forEach from "lodash/forEach";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";
import { DateTime } from "luxon";

import { query, type QueryCtx as QueryContext } from "./_generated/server";

const getAllJobs = async (context: QueryContext) => {
  const [jobs, technologies, methodologies] = await Promise.all([
    context.db.query("job").collect(),
    context.db.query("technology").collect(),
    context.db.query("methodology").collect(),
  ]);

  const withItems = map(jobs, (job) => {
    return {
      ...job,
      methodologiesUsed: map(job.methodologiesUsed, (methId) => {
        return find(methodologies, (item) => {
          return item._id === methId;
        })?.name ?? "";
      }),
      technologiesUsed: map(job.technologiesUsed, (techId) => {
        return find(technologies, (item) => {
          return item._id === techId;
        })?.name ?? "";
      }),
    };
  });

  return orderBy(withItems, [(job) => {
    return new Date(job.startDate);
  }], ["desc"]);
};

export const getAll = query({
  args: {},
  handler: async (context) => {
    return getAllJobs(context);
  },
});

export const getExperience = query({
  args: {},
  handler: async (context) => {
    const jobs = await getAllJobs(context);

    const engine = new ComputeEngine();
    const skills = new Map<string, string>();
    const years: number[] = [];

    forEach(jobs, (job) => {
      const startDate = DateTime.fromJSDate(new Date(job.startDate));
      const endDate = DateTime.fromJSDate(isNil(job.endDate)
        ? new Date()
        : new Date(job.endDate));
      const diff = endDate.diff(startDate, "years").years;
      years.push(diff);

      for (const item of concat(job.technologiesUsed, job.methodologiesUsed)) {
        if (skills.has(item)) {
          const expression = engine.box(["Add", skills.get(item) ?? 0, diff]);
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          skills.set(item, String(expression.value));
        } else {
          skills.set(item, String(diff));
        }
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const max = String(engine.box(["Add", ...years]).value);

    const values = map([...skills], ([name, experience]) => {
      return {
        experience,
        name,
      };
    });

    const sorted = orderBy(values, "experience", "desc");

    return {
      max,
      skills: sorted,
    };
  },
});

