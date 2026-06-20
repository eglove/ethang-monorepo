import { describe, expect, it } from "vitest";

import { auth } from "./auth.ts";
import { courseTracking } from "./course-tracking.ts";
import { courses } from "./courses.ts";
import { errors } from "./errors.ts";
import { forms } from "./forms.ts";
import { navigation } from "./navigation.ts";
import { rss } from "./rss.ts";
import { ui } from "./ui.ts";

const modules = {
  auth,
  courses,
  courseTracking,
  errors,
  forms,
  navigation,
  rss,
  ui
};

describe("intl constants", () => {
  it("has no duplicate string values across all modules", () => {
    const valueToModules = new Map<string, string[]>();

    for (const [moduleName, module] of Object.entries(modules)) {
      for (const [key, value] of Object.entries(
        module as Record<string, string>
      )) {
        const existing = valueToModules.get(value);
        if (existing) {
          existing.push(`${moduleName}.${key}`);
        } else {
          valueToModules.set(value, [`${moduleName}.${key}`]);
        }
      }
    }

    // eslint-disable-next-line lodash/prefer-lodash-method
    const duplicates = [...valueToModules]
      .filter(([, locations]) => {
        return 1 < locations.length;
      })

      .map(([value, locations]) => {
        return { locations, value };
      });

    expect(duplicates).toStrictEqual([]);
  });
});
