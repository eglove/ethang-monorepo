import { ApplicationsPerDayChart } from "@/components/job-tracker/applications-per-day-chart.tsx";
import { JobTrackerTable } from "@/components/job-tracker/job-tracker-table.tsx";
import { createFileRoute } from "@tanstack/react-router";

const Index = () => {
  return (
    <div>
      <JobTrackerTable />
      <ApplicationsPerDayChart />
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
