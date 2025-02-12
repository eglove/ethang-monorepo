"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { queries } from "@/data/queries.ts";
import { useQuery } from "@tanstack/react-query";
import forEach from "lodash/forEach.js";
import get from "lodash/get";
import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";
import set from "lodash/set.js";
import slice from "lodash/slice.js";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

const chartConfig = {
  count: {
    color: "hsl(var(--chart-1))",
    label: "Count",
  },
} satisfies ChartConfig;

export const CompaniesChart = () => {
  const query = useQuery(queries.getApplications());

  const companyData = useMemo(() => {
    const results: Record<string, number> = {};

    forEach(query.data, (item) => {
      set(results, [item.company], get(results, [item.company], 0) + 1);
    });

    const allData = orderBy(
      map(results, (count, company) => {
        return { company, count };
      }),
      ["count"],
      ["desc"],
    );
    return slice(allData, 0, 10);
  }, [query.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Companies</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={companyData}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="company"
              tickLine={false}
              tickMargin={10}
            />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={false}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
