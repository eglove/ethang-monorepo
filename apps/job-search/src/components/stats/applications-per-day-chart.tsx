import { computeEngine } from "@/components/common/providers.tsx";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { queries } from "@/data/queries.ts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import filter from "lodash/filter.js";
import findIndex from "lodash/findIndex.js";
import get from "lodash/get";
import isNil from "lodash/isNil";
import slice from "lodash/slice.js";
import { DateTime } from "luxon";
import { useMemo } from "react";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

export const ApplicationsPerDayChart = () => {
  const query = useQuery(queries.getApplications());

  const data = useMemo(() => {
    const today = DateTime.now();
    let start = DateTime.now().minus({ days: 30 });

    const getFilteredList = () => {
      return filter(query.data?.applications, (datum) => {
        return (
          new Date(datum.applied).toDateString() ===
          start.toJSDate().toDateString()
        );
      });
    };

    const chartData = [];
    while (start.toMillis() <= today.toMillis()) {
      const dayApplications = getFilteredList();

      chartData.push({
        applications: dayApplications.length,
        date: start.toLocaleString({
          day: "numeric",
          month: "short",
          weekday: "short",
          year: "2-digit",
        }),
      });

      start = start.plus({ days: 1 });
    }

    return slice(
      chartData,
      findIndex(chartData, (d) => 0 < d.applications),
    );
  }, [query.data?.applications]);

  const average = useMemo(() => {
    if (isNil(query.data?.applications)) {
      return 0;
    }

    return computeEngine.box([
      "Divide",
      query.data.applications.length,
      data.length,
    ]).value;
  }, [data.length, query.data?.applications]);

  return (
    <Card className="border border-transparent p-4 dark:border-default-100">
      <CardHeader className="p-0">
        <div className="flex flex-col gap-y-1 p-4">
          <dt>
            <TypographyH3>Applications / Day ({data.length} Days)</TypographyH3>
          </dt>
          <dd className="text-sm">
            Average: {Number(average).toLocaleString()}, Total:{" "}
            {get(query, ["data", "applications", "length"], 0)}
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
            <Tooltip
              content={({ payload }) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion,@typescript-eslint/no-shadow
                const data = get(payload, [0, "payload"]) as unknown as
                  | {
                      applications: number;
                      date: string;
                    }
                  | undefined;

                return (
                  <div className="bg-background px-4 py-2">
                    <div>
                      {isNil(data?.date)
                        ? ""
                        : new Date(data.date).toDateString()}
                    </div>
                    <div>{get(data, ["applications"], 0)} Applications</div>
                  </div>
                );
              }}
              cursor={false}
            />
            <Line
              activeDot={{
                r: 6,
              }}
              dot={{
                fill: "hsl(var(--heroui-primary))",
              }}
              dataKey="applications"
              stroke="hsl(var(--heroui-primary))"
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
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};
