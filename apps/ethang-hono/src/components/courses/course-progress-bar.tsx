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
    "flex h-4 items-center justify-center p-0.5 text-center text-xs leading-none font-medium text-white transition-all duration-500 ease-out";
  const { complete, incomplete, revisit } =
    coursePathData.getStatusPercentages();

  return (
    <div
      id="course-progress-bar"
      class={twMerge(
        "flex w-full rounded-full overflow-hidden bg-neutral-quaternary",
        properties?.classNames?.container,
      )}
    >
      <div
        id="complete-progress"
        style={`width: ${complete}%`}
        className={twMerge(baseStyles, "bg-brand", 0 === complete && "hidden")}
      >
        {minToShow > complete ? "" : formatter.format(complete / 100)}
      </div>

      <div
        id="revisit-progress"
        style={`width: ${revisit}%`}
        class={twMerge(baseStyles, "bg-warning", 0 === revisit && "hidden")}
      >
        {minToShow > revisit ? "" : formatter.format(revisit / 100)}
      </div>

      <div
        id="incomplete-progress"
        style={`width: ${incomplete}%`}
        class={twMerge(
          baseStyles,
          "bg-neutral-quaternary",
          100 === incomplete && "hidden",
        )}
      >
        {minToShow > incomplete ? "" : formatter.format(incomplete / 100)}
      </div>
    </div>
  );
};
