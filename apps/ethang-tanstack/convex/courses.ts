import { HTTP_STATUS } from "@ethang/toolbelt/src/constants/http";
import { v } from "convex/values";
import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";

import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

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

export const createCourse = mutation({
  args: {
    name: v.string(),
    url: v.string(),
  },
  handler: async (context, _arguments) => {
    const user = await getCurrentUser(context);

    if (isNil(user) || "admin" !== user.role) {
      return new Response(JSON.stringify({ message: "Unauthenticated" }), { status: HTTP_STATUS.UNAUTHORIZED });
    }

    const course = await context.db.query("course").withIndex("by_name_url", (q) => {
      return q.eq("name", _arguments.name).eq("url", _arguments.url);
    })
      .unique();

    if (!isNil(course)) {
      return new Response(JSON.stringify({ message: "Course already exists" }), { status: HTTP_STATUS.CONFLICT });
    }

    const created = await context.db.insert("course", {
      name: _arguments.name,
      url: _arguments.url,
    });

    if (isNil(created)) {
      return new Response(JSON.stringify({ message: "Failed to create course" }), { status: HTTP_STATUS.INTERNAL_SERVER_ERROR });
    }

    return new Response(JSON.stringify(created), {
      status: HTTP_STATUS.CREATED,
    });
  },
});
