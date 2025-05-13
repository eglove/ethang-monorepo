import type { StatsSchema } from "@ethang/schemas/src/job-search/stats.ts";

import isNil from "lodash/isNil";

import { TrendCard } from "@/components/common/trend-card.tsx";

type StatsBoardProperties = Readonly<{
  stats: null | StatsSchema | undefined;
}>;

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

export const StatsCards = ({ stats }: StatsBoardProperties) => {
  return (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <TrendCard
        title="Avg. Days to Interview"
        value={getStringValue(stats?.averageTimeToInterview)}
      />
      <TrendCard
        title="Avg. Days to Rejection"
        value={getStringValue(stats?.averageTimeToRejection)}
      />
      <TrendCard
        title="Current Response Rate"
        value={getStringValue(stats?.averageResponseRate, { style: "percent" })}
      />
      <TrendCard
        title="Total Applications"
        value={getStringValue(stats?.totalApplications)}
      />
      <TrendCard
        title="Total Companies"
        value={getStringValue(stats?.totalCompanies)}
      />
    </div>
  );
};
