import { Card } from "@/components/ui/card.tsx";
import { queries } from "@/data/queries.ts";
import { useQuery } from "@tanstack/react-query";
import forEach from "lodash/forEach.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import { DateTime } from "luxon";
import { useMemo } from "react";

export const StatsBar = () => {
  const query = useQuery(queries.getApplications());

  const [rejectionAverage, interviewAverage, companyCount, daysApplied] =
    useMemo(() => {
      let totalRejectionTime = 0;
      let totalRejections = 0;
      let totalInterviewTime = 0;
      let totalInterviews = 0;
      const companies = new Set<string>();
      const applicationDays = new Set<string>();

      forEach(query.data, (item) => {
        companies.add(item.company);
        applicationDays.add(item.applied.toDateString());

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
            return b.getTime() - a.getTime();
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

      return [
        averageRejectionTime,
        averageInterviewTime,
        companies.size,
        applicationDays.size,
      ];
    }, [query.data]);

  return (
    <Card className="p-4 my-4">
      <div>Days Tracked: {daysApplied}</div>
      <div>Total Applications: {query.data?.length ?? ""}</div>
      <div>Total Companies: {companyCount}</div>
      <div>Avg. Days to Rejection: {rejectionAverage.toLocaleString()}</div>
      <div>Avg. Days to Interview: {interviewAverage.toLocaleString()}</div>
    </Card>
  );
};
