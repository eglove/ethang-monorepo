import { computeEngine } from "@/components/common/providers.tsx";
import { TrendCard } from "@/components/common/trend-card.tsx";
import { queries } from "@/data/queries.ts";
import { isNumber } from "@ethang/toolbelt/src/is/number.ts";
import { useQuery } from "@tanstack/react-query";
import forEach from "lodash/forEach";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import isString from "lodash/isString.js";
import map from "lodash/map.js";
import { DateTime } from "luxon";
import { useMemo } from "react";

export const KeyStats = () => {
  const query = useQuery(queries.getApplications());

  const data = useMemo(() => {
    const companies = new Set<string>();
    const applicationDays = new Set<string>();
    const interviewTimes: number[] = [];
    const rejectionTimes: number[] = [];

    forEach(query.data, (item) => {
      companies.add(item.company);
      applicationDays.add(new Date(item.applied).toDateString());

      if (!isNil(item.rejected)) {
        const rejectionTime = DateTime.fromJSDate(new Date(item.rejected)).diff(
          DateTime.fromJSDate(new Date(item.applied)),
          ["days"],
        ).days;

        rejectionTimes.push(rejectionTime);
      }

      if (!isEmpty(item.interviewRounds)) {
        const firstInterview = item.interviewRounds?.sort((a, b) => {
          return new Date(b).getTime() - new Date(a).getTime();
        })[0];

        if (!isNil(firstInterview)) {
          const interviewTime = DateTime.fromJSDate(
            new Date(firstInterview),
          ).diff(DateTime.fromJSDate(new Date(item.applied)), ["days"]).days;

          interviewTimes.push(interviewTime);
        }
      }
    });

    const averageRejectionTime = computeEngine.box([
      "Divide",
      ["Add", ...rejectionTimes],
      rejectionTimes.length,
    ]).value;

    const averageInterviewTime = computeEngine.box([
      "Divide",
      ["Add", ...interviewTimes],
      interviewTimes.length,
    ]).value;

    return {
      "Avg. Days to Interview": averageInterviewTime,
      "Avg. Days to Rejection": averageRejectionTime,
      Companies: companies.size,
      "Days Tracked": applicationDays.size,
      "Total Applications": query.data?.length ?? 0,
    };
  }, [query.data]);

  return (
    <dl className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {map(data, (value, key) => {
        if (!isString(value) && !isNumber(value)) {
          return null;
        }

        return (
          <TrendCard key={key} title={key} value={value.toLocaleString()} />
        );
      })}
    </dl>
  );
};
