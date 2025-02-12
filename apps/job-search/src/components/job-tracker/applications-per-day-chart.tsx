import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart.tsx";
import { queries } from "@/data/queries.ts";
import { useQuery } from "@tanstack/react-query";
import forEach from "lodash/forEach.js";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import { useMemo } from "react";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";

const chartConfig = {
  desktop: {
    color: "hsl(var(--chart-1))",
    label: "Applications",
  },
} satisfies ChartConfig;

export const ApplicationsPerDayChart = () => {
  const query = useQuery(queries.getApplications());

  const data = useMemo(() => {
    const results: Record<string, number> = {};

    forEach(query.data, (item) => {
      const date = item.applied.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        weekday: "short",
        year: "2-digit",
      });

      if (isNil(results[date])) {
        results[date] = 1;
      } else {
        results[date] += 1;
      }
    });

    return map(results, (value, key) => {
      return { applications: value, date: key };
    }).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [query.data]);

  const average = useMemo(() => {
    if (isNil(query.data)) {
      return 0;
    }

    return query.data.length / data.length;
  }, [data.length, query.data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Applications / Day</CardTitle>
        <CardDescription>
          Average: {average.toLocaleString()}, Total: {query.data?.length ?? 0},
          Days: {data.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12, top: 20 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
              cursor={false}
            />
            <Line
              activeDot={{
                r: 6,
              }}
              dot={{
                fill: "var(--color-desktop)",
              }}
              dataKey="applications"
              stroke="var(--color-desktop)"
              strokeWidth={2}
              type="natural"
            >
              <LabelList
                className="fill-foreground"
                fontSize={12}
                offset={12}
                position="top"
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
