import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";

import { query } from "./_generated/server";

export const getCourses = query({
  args: {},
  handler: async (context) => {
    const [sections, courses] = await Promise.all([
      context.db.query("courseSection").collect(),
      context.db.query("course").collect(),
    ]);

    return orderBy(map(sections, (section) => {
      return {
        ...section,
        courses: filter(courses, (course) => {
          return includes(section.courses, course._id);
        }),
      };
    }), ["order"]);
  },
});
