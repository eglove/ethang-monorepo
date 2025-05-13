import { createFileRoute } from "@tanstack/react-router";

import { JobTrackerTable } from "@/components/job-tracker/job-tracker-table.tsx";
import { MainLayout } from "@/components/layouts/main-layout.tsx";

const Index = () => {
  return (
    <MainLayout classNames={{ container: "max-w-screen" }}>
      <JobTrackerTable />
    </MainLayout>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
