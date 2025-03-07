import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { DailyApplicationsChart } from "@/components/stats/daily-applications-chart.tsx";
import { StatsCards } from "@/components/stats/stats-cards.tsx";
import { TopCompaniesChart } from "@/components/stats/top-companies-chart.tsx";
import { useUserStore } from "@/components/stores/user-store.ts";
import { getGlobalStats } from "@/data/methods/get-global-stats.ts";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  const globalStats = useQuery(getGlobalStats());
  const store = useUserStore();

  return (
    <MainLayout>
      {!store.isSignedIn && (
        <div className="text-center text-3xl font-bold">Sign In for stats</div>
      )}
      {store.isSignedIn && (
        <div className="grid gap-4">
          <StatsCards stats={globalStats.data} />
          <DailyApplicationsChart color="secondary" stats={globalStats.data} />
          <TopCompaniesChart color="secondary" stats={globalStats.data} />
        </div>
      )}
    </MainLayout>
  );
};

export const Route = createFileRoute("/global-stats")({
  component: RouteComponent,
});
