import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { DailyApplicationsChart } from "@/components/stats/daily-applications-chart.tsx";
import { StatsCards } from "@/components/stats/stats-cards.tsx";
import { TopCompaniesChart } from "@/components/stats/top-companies-chart.tsx";
import { getUserStats } from "@/data/methods/get-user-stats.ts";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  const userStats = useQuery(getUserStats());

  return (
    <MainLayout>
      <div className="grid gap-4">
        <StatsCards stats={userStats.data} />
        <DailyApplicationsChart stats={userStats.data} />
        <TopCompaniesChart stats={userStats.data} />
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/stats")({
  component: RouteComponent,
});
