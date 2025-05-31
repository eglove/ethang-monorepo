import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { DailyApplicationsChart } from "../../components/stats/daily-applications-chart.tsx";
import { StatsCards } from "../../components/stats/stats-card.tsx";
import { TopCompaniesChart } from "../../components/stats/top-companies-chart.tsx";

const RouteComponent = () => {
  return (
    <MainLayout
      breadcrumbPaths={[
        { href: "/job-search", label: "Job Search" },
        { href: "/job-search/stats", label: "Stats" },
      ]}
    >
      <div className="grid gap-4">
        <StatsCards />
        <DailyApplicationsChart />
        <TopCompaniesChart />
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/job-search/stats")({
  component: RouteComponent,
});
