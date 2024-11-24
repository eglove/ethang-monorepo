import find from "lodash/find.js";
import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";
import sortBy from "lodash/sortBy";

import { query } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (context) => {
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
  },
});

