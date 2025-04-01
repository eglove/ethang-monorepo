import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipProps } from "recharts/types/component/Tooltip";

import get from "lodash/get";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";

export const DailyApplicationsChartTooltip = ({
  payload,
}: Readonly<TooltipProps<ValueType, NameType>>) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const data = get(payload, [0, "payload"]) as unknown as
    | {
        count: number;
        date: string;
      }
    | undefined;

  return (
    <div className="bg-background px-4 py-2">
      <div>
        {isNil(data?.date)
          ? ""
          : DateTime.fromISO(data.date).toJSDate().toDateString()}
      </div>
      <div>{get(data, ["count"], 0)} Applications</div>
    </div>
  );
};
