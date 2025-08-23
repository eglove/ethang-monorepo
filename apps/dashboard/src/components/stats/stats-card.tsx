import { useQuery } from "@apollo/client/react";
import isNil from "lodash/isNil";

import {
  type GetApplicationStats,
  getApplicationStats,
} from "../../graphql/queries/get-application-stats.ts";
import { TrendCard } from "./trend-card.tsx";

const getStringValue = (
  value: null | number | undefined,
  options?: Intl.NumberFormatOptions,
) => {
  if (isNil(value)) {
    return "N/A";
  }

  return isNil(options)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, options);
};

export const StatsCards = () => {
  const { data } = useQuery<GetApplicationStats>(getApplicationStats);

  return (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <TrendCard
        title="Avg. Days to Rejection"
        value={getStringValue(data?.applicationStats.averageTimeToRejected)}
      />
      <TrendCard
        value={getStringValue(data?.applicationStats.averageResponseRate, {
          style: "percent",
        })}
        title="Current Response Rate"
      />
      <TrendCard
        title="Total Applications"
        value={getStringValue(data?.applicationStats.totalApplications)}
      />
      <TrendCard
        title="Total Companies"
        value={getStringValue(data?.applicationStats.totalCompanies)}
      />
    </div>
  );
};
