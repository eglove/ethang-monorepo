"use client";

import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { queries } from "@/data/queries.ts";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import forEach from "lodash/forEach.js";
import get from "lodash/get";
import map from "lodash/map.js";
import orderBy from "lodash/orderBy.js";
import set from "lodash/set.js";
import slice from "lodash/slice.js";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const CompaniesChart = () => {
  const query = useQuery(queries.getApplications());

  const companyData = useMemo(() => {
    const results: Record<string, number> = {};

    forEach(query.data?.applications, (item) => {
      set(results, [item.company], get(results, [item.company], 0) + 1);
    });

    const allData = orderBy(
      map(results, (count, company) => {
        return { company, count };
      }),
      ["count"],
      ["desc"],
    );
    return slice(allData, 0, 5);
  }, [query.data?.applications]);

  return (
    <Card>
      <CardHeader>
        <TypographyH3>Top 5 Companies</TypographyH3>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer height={300}>
          <BarChart accessibilityLayer data={companyData}>
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
                  <div className="bg-background py-2 px-4 rounded">
                    {label}: {count}
                  </div>
                );
              }}
              cursor={false}
            />
            <Bar dataKey="count" fill="hsl(var(--heroui-primary))" radius={8} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};
