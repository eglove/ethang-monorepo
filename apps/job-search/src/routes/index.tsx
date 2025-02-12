import { ApplicationsPerDayChart } from "@/components/job-tracker/applications-per-day-chart.tsx";
import { CompaniesChart } from "@/components/job-tracker/companies-chart.tsx";
import { JobTrackerTable } from "@/components/job-tracker/job-tracker-table.tsx";
import { StatsBar } from "@/components/job-tracker/stats-bar.tsx";
import { createFileRoute } from "@tanstack/react-router";

const Index = () => {
  return (
    <div className="m-4 mb-24">
      <JobTrackerTable />
      <StatsBar />
      <div className="grid grid-cols-2 gap-4">
        <ApplicationsPerDayChart />
        <CompaniesChart />
      </div>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
