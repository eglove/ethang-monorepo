import type { StatsSchema } from "@ethang/schemas/src/job-search/stats.ts";

import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { Card, CardBody, CardHeader } from "@heroui/react";
import get from "lodash/get";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TopCompaniesChartProperties = Readonly<{
  color?: "primary" | "secondary";
  stats?: StatsSchema | undefined;
}>;

export const TopCompaniesChart = ({
  color = "primary",
  stats,
}: TopCompaniesChartProperties) => {
  const topCompanies = get(stats, ["topCompanies"], []);

  return (
    <Card>
      <CardHeader>
        <TypographyH3>Top {topCompanies.length} Companies</TypographyH3>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer height={300}>
          <BarChart accessibilityLayer data={topCompanies}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="company"
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              dataKey="count"
              tickLine={false}
              tickMargin={10}
            />
            <Tooltip
              content={({ label, payload }) => {
                const count = get(
                  payload,
                  [0, "payload", "count"],
                  "",
                ) as unknown;

                return (
                  <div className="rounded bg-background px-4 py-2">
                    {label}: {count}
                  </div>
                );
              }}
              cursor={false}
            />
            <Bar
              dataKey="count"
              fill={`hsl(var(--heroui-${color}))`}
              radius={8}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};
