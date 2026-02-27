import isNil from "lodash/isNil.js";
import join from "lodash/join.js";
import kebabCase from "lodash/kebabCase.js";
import map from "lodash/map.js";
import slice from "lodash/slice.js";
import split from "lodash/split.js";

import { coursePathData } from "../../stores/course-path-store.ts";
import { ChevronDownSvg } from "../svg/chevron-down.tsx";
import { swebokFocusMap } from "./courses-container.tsx";

export const CourseToc = async () => {
  const { learningPaths } = coursePathData;

  return (
    <details class="group/toc w-fit rounded-xl border border-gray-200 bg-gray-50/50 p-2 dark:border-gray-800 dark:bg-gray-900/50">
      <summary class="flex cursor-pointer items-center gap-4 px-4 py-2 text-sm font-medium text-gray-700 select-none hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400">
        <span>Table of Contents</span>
        <ChevronDownSvg className="h-4 w-4 transition-transform group-open/toc:rotate-180" />
      </summary>
      <div class="mt-2 flex flex-col gap-1 px-4 pb-2">
        {map(learningPaths, async (path) => {
          const names = split(path.name, ":");
          const [firstPart] = names;
          const secondPart = join(slice(names, 1), " ");
          const hasSecondPart = !isNil(secondPart) && "" !== secondPart;
          const id = kebabCase(path.name);

          return (
            <a
              data-toc-link
              href={`#${id}`}
              class="group flex items-center gap-2 py-1 text-sm transition-colors hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <span class="h-1 w-1 rounded-full bg-gray-300 group-hover:bg-indigo-500 dark:bg-gray-700 dark:group-hover:bg-indigo-400" />
              <span
                class={
                  hasSecondPart
                    ? "text-gray-600 dark:text-gray-300"
                    : "text-fuchsia-600 dark:text-fuchsia-400"
                }
              >
                {firstPart}
                {hasSecondPart ? ":" : ""}
              </span>
              {hasSecondPart && (
                <span class="text-fuchsia-600 dark:text-fuchsia-400">
                  {" "}
                  {secondPart}
                </span>
              )}
              <span class="ml-auto text-[10px] tracking-tighter text-gray-500 uppercase group-hover:text-emerald-600 dark:text-gray-400 dark:group-hover:text-emerald-400">
                {swebokFocusMap.get(path.swebokFocus)}
              </span>
            </a>
          );
        })}
      </div>
    </details>
  );
};
