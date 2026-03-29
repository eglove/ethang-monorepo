import { twMerge } from "tailwind-merge";

import { coursePathData } from "../../stores/course-path-store.ts";

type CourseProgressBarProperties = {
  classNames?: {
    container?: string;
  };
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "percent",
});

const minToShow = 7;

export const CourseProgressBar = async (
  properties?: CourseProgressBarProperties,
) => {
  const baseStyles =
    "flex h-4 items-center justify-center p-0.5 text-center text-xs leading-none font-medium transition-all duration-500 ease-out";
  const { complete, incomplete, revisit } =
    coursePathData.getStatusPercentages();

  return (
    <div
      id="course-progress-bar"
      class={twMerge(
        "flex w-full rounded-full overflow-hidden bg-slate-700",
        properties?.classNames?.container,
      )}
    >
      <div
        id="complete-progress"
        style={`width: ${complete}%`}
        class={twMerge(
          baseStyles,
          "bg-sky-300 text-slate-900",
          0 === complete && "hidden",
        )}
      >
        {minToShow > complete ? "" : formatter.format(complete / 100)}
      </div>

      <div
        id="revisit-progress"
        style={`width: ${revisit}%`}
        class={twMerge(
          baseStyles,
          "bg-amber-400 text-slate-900",
          0 === revisit && "hidden",
        )}
      >
        {minToShow > revisit ? "" : formatter.format(revisit / 100)}
      </div>

      <div
        id="incomplete-progress"
        style={`width: ${incomplete}%`}
        class={twMerge(
          baseStyles,
          "bg-slate-600 text-slate-200",
          100 === incomplete && "hidden",
        )}
      >
        {minToShow > incomplete ? "" : formatter.format(incomplete / 100)}
      </div>
    </div>
  );
};
