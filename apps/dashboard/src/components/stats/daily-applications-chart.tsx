import { useStore } from "@ethang/store/use-store";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import get from "lodash/get.js";
import orderBy from "lodash/orderBy.js";
import { DateTime } from "luxon";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { getStats } from "../../data/queries/stats.ts";
import { authStore } from "../../stores/auth-store.ts";
import { DailyApplicationsChartTooltip } from "./daily-applications-chart-tooltip.tsx";

export const DailyApplicationsChart = () => {
  const userId = useStore(authStore, (state) => state.userId);
  const { data } = useQuery(getStats(userId ?? undefined));

  const applicationsPerDay = orderBy(get(data, ["userDailyApplications"], []), [
    "date",
  ]);
  const totalApplications = get(data, ["totalApplications"], 0);
  const averageApplicationsPerDay = get(data, ["averageApplicationsPerDay"], 0);
  const earliestDate = get(applicationsPerDay, [0, "date"], "");

  const totalDays = (
    DateTime.now().diff(DateTime.fromFormat(earliestDate, "yyyy-MM-dd"), [
      "days",
    ]).days + 1
  ).toFixed(0);

  return (
    <Card className="dark:border-default-100 border border-transparent p-4">
      <CardHeader className="p-0">
        <div className="flex flex-col gap-y-1 p-4">
          <dt className="prose">
            <h3 className="text-foreground">
              Applications / Day ({totalDays} Days)
            </h3>
          </dt>
          <dd className="text-sm">
            Average: {averageApplicationsPerDay.toLocaleString()}, Total:{" "}
            {totalApplications.toLocaleString()}
          </dd>
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <ResponsiveContainer
          className="[&_.recharts-surface]:outline-none"
          height={300}
        >
          <LineChart
            accessibilityLayer
            data={applicationsPerDay}
            margin={{ left: 12, right: 12, top: 20 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              tickLine={false}
              tickMargin={8}
            />
            <Tooltip content={DailyApplicationsChartTooltip} />
            <Line
              dot={{
                fill: `hsl(var(--heroui-primary))`,
              }}
              activeDot={{ r: 6 }}
              dataKey="totalApplications"
              stroke={`hsl(var(--heroui-primary))`}
              strokeWidth={2}
              type="natural"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};
