import { JobTrackerTable } from "@/components/job-tracker/job-tracker-table.tsx";
import { createFileRoute } from "@tanstack/react-router";

const Index = () => {
  return <JobTrackerTable />;
};

export const Route = createFileRoute("/")({
  component: Index,
});
