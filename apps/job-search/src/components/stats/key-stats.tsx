import { TrendCard } from "@/components/common/trend-card.tsx";
import { queries } from "@/data/queries.ts";
import { useQuery } from "@tanstack/react-query";
import forEach from "lodash/forEach";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import { DateTime } from "luxon";
import { useMemo } from "react";

export const KeyStats = () => {
  const query = useQuery(queries.getApplications());

  const data = useMemo(() => {
    let totalRejectionTime = 0;
    let totalRejections = 0;
    let totalInterviewTime = 0;
    let totalInterviews = 0;
    const companies = new Set<string>();
    const applicationDays = new Set<string>();

    forEach(query.data, (item) => {
      companies.add(item.company);
      applicationDays.add(new Date(item.applied).toDateString());

      if (!isNil(item.rejected)) {
        const rejectionTime = DateTime.fromJSDate(item.rejected).diff(
          DateTime.fromJSDate(item.applied),
          ["days"],
        ).days;

        totalRejectionTime += rejectionTime;
        totalRejections += 1;
      }

      if (!isEmpty(item.interviewRounds)) {
        const firstInterview = item.interviewRounds?.sort((a, b) => {
          return new Date(b).getTime() - new Date(a).getTime();
        })[0];

        if (!isNil(firstInterview)) {
          const interviewTime = DateTime.fromJSDate(firstInterview).diff(
            DateTime.fromJSDate(item.applied),
            ["days"],
          ).days;

          totalInterviewTime += interviewTime;
          totalInterviews += 1;
        }
      }
    });

    const averageRejectionTime = totalRejectionTime / totalRejections;
    const averageInterviewTime = totalInterviewTime / totalInterviews;

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
        return <TrendCard title={key} value={value.toLocaleString()} />;
      })}
    </dl>
  );
};
