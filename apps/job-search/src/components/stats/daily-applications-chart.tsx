import type { StatsSchema } from "@ethang/schemas/src/job-search/stats.ts";

import { Card, CardBody, CardHeader } from "@heroui/react";
import get from "lodash/get";
import { DateTime } from "luxon";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

import { DailyApplicationsChartTooltip } from "@/components/stats/daily-applications-chart-tooltip.tsx";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";

type DailyApplicationsChartProperties = Readonly<{
  color?: "primary" | "secondary";
  stats: null | StatsSchema | undefined;
}>;

export const DailyApplicationsChart = ({
  color = "primary",
  stats,
}: DailyApplicationsChartProperties) => {
  const applicationsPerDay = get(stats, ["applicationsPerDay"], []);
  const totalApplications = get(stats, ["totalApplications"], 0);
  const averageApplicationsPerDay = get(
    stats,
    ["averageApplicationsPerDay"],
    0,
  );
  const earliestDate = get(
    stats,
    ["applicationsPerDay", 0, "date"],
    DateTime.now().toISO(),
  );
  const totalDays = DateTime.now()
    .diff(DateTime.fromISO(earliestDate), ["days"])
    .days.toFixed(0);

  return (
    <Card className="border border-transparent p-4 dark:border-default-100">
      <CardHeader className="p-0">
        <div className="flex flex-col gap-y-1 p-4">
          <dt>
            <TypographyH3>Applications / Day ({totalDays} Days)</TypographyH3>
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
                fill: `hsl(var(--heroui-${color}))`,
              }}
              activeDot={{ r: 6 }}
              dataKey="count"
              stroke={`hsl(var(--heroui-${color}))`}
              strokeWidth={2}
              type="natural"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};
