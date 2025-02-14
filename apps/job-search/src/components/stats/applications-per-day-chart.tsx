import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { queries } from "@/data/queries.ts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import forEach from "lodash/forEach";
import get from "lodash/get";
import isNil from "lodash/isNil";
import map from "lodash/map";
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
    <Card className="p-4 border border-transparent dark:border-default-100">
      <CardHeader className="p-0">
        <div className="flex flex-col gap-y-1 p-4">
          <dt>
            <TypographyH3>Applications / Day</TypographyH3>
          </dt>
          <dd className="text-sm">
            Average: {average.toLocaleString()}, Total:{" "}
            {get(query, ["data", "length"], 0)}, Days: {data.length}
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
                  <div className="bg-background py-2 px-4">
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
