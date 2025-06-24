import { useStore } from "@ethang/store/use-store";
import { useQuery } from "@tanstack/react-query";
import isNil from "lodash/isNil";

import { getStats } from "../../data/queries/stats.ts";
import { authStore } from "../../stores/auth-store.ts";
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
  const userId = useStore(authStore, (state) => state.userId);
  const { data } = useQuery(getStats(userId ?? undefined));

  return (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <TrendCard
        title="Avg. Days to Interview"
        value={getStringValue(data?.averageTimeToInterview)}
      />
      <TrendCard
        title="Avg. Days to Rejection"
        value={getStringValue(data?.averageTimeToRejected)}
      />
      <TrendCard
        title="Current Response Rate"
        value={getStringValue(data?.averageResponseRate, { style: "percent" })}
      />
      <TrendCard
        title="Total Applications"
        value={getStringValue(data?.totalApplications)}
      />
      <TrendCard
        title="Total Companies"
        value={getStringValue(data?.totalCompanies)}
      />
    </div>
  );
};
