import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { ApplicationsPerDayChart } from "@/components/stats/applications-per-day-chart.tsx";
import { CompaniesChart } from "@/components/stats/companies-chart.tsx";
import { KeyStats } from "@/components/stats/key-stats.tsx";
import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  return (
    <MainLayout>
      <div className="grid gap-4">
        <KeyStats />
        <ApplicationsPerDayChart />
        <CompaniesChart />
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/stats")({
  component: RouteComponent,
});
