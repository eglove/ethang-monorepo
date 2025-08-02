import { useQuery } from "@apollo/client";
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

import {
  getApplicationStats,
  type GetApplicationStats,
} from "../../graphql/queries/get-application-stats.ts";
import { TopCompaniesChartTooltip } from "./top-companies-chart-tooltip.tsx";

export const TopCompaniesChart = () => {
  const { data } = useQuery<GetApplicationStats>(getApplicationStats);

  const topCompanies = get(data, ["applicationStats", "topCompanies"], []);

  return (
    <Card>
      <CardHeader className="prose">
        <h3 className="text-foreground">Top {topCompanies.length} Companies</h3>
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
              dataKey={(value: (typeof topCompanies)[0]) => {
                return get(value, ["_count", "id"], 0);
              }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <Tooltip content={TopCompaniesChartTooltip} cursor={false} />
            <Bar
              dataKey={(value: (typeof topCompanies)[0]) => {
                return get(value, ["_count", "id"], 0);
              }}
              fill={`hsl(var(--heroui-primary))`}
              radius={8}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};
