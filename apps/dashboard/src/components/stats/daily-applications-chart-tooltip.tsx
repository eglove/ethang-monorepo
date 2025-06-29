import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

import get from "lodash/get";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";

export const DailyApplicationsChartTooltip = ({
  payload,
}: Readonly<TooltipContentProps<ValueType, NameType>>) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const data = get(payload, [0, "payload"]) as unknown as
    | {
        date: string;
        totalApplications: number;
      }
    | undefined;

  return (
    <div className="bg-background px-4 py-2">
      <div>
        {isNil(data?.date)
          ? ""
          : DateTime.fromISO(data.date).toJSDate().toDateString()}
      </div>
      <div>{get(data, ["totalApplications"], 0)} Applications</div>
    </div>
  );
};
