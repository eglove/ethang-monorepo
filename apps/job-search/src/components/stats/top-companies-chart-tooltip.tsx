import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipProps } from "recharts/types/component/Tooltip";

import get from "lodash/get";

export const DailyApplicationsChartTooltip = ({
  label,
  payload,
}: Readonly<TooltipProps<ValueType, NameType>>) => {
  const count = get(payload, [0, "payload", "count"], "") as unknown;

  return (
    <div className="rounded bg-background px-4 py-2">
      {label}: {count}
    </div>
  );
};
