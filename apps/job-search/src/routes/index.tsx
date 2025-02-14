import { JobTrackerTable } from "@/components/job-tracker/job-tracker-table.tsx";
import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { createFileRoute } from "@tanstack/react-router";

const Index = () => {
  return (
    <MainLayout>
      <JobTrackerTable />
    </MainLayout>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
