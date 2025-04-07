import map from "lodash/map";

const weekdayAnnotations = [
  { add: "un", short: "S" },
  { add: "on", short: "M" },
  { add: "ue", short: "T" },
  { add: "ed", short: "W" },
  { add: "hu", short: "T" },
  { add: "ri", short: "F" },
  { add: "at", short: "S" },
];

export const CalendarMonthViewHeading = () => {
  return (
    <div className="shadow ring-1 ring-black/5 lg:flex lg:flex-auto lg:flex-col">
      <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs/6 font-semibold text-gray-700 lg:flex-none">
        {map(weekdayAnnotations, (annotation) => {
          return (
            <div className="bg-white py-2" key={annotation.add}>
              {annotation.short}
              <span className="sr-only sm:not-sr-only">{annotation.add}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
