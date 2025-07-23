import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";

import get from "lodash/get";

export const TopCompaniesChartTooltip = ({
  payload,
}: Readonly<TooltipContentProps<ValueType, NameType>>) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const data = get(payload, [0, "payload"]) as unknown as
    | { _count: { id: number }; company: string }
    | undefined;

  return (
    <div className="bg-background rounded px-4 py-2">
      <div>{get(data, ["_count", "id"], 0)} Applications</div>
    </div>
  );
};
