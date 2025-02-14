import { ImportApplications } from "@/components/add-edit-application/import-applications.tsx";
import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  return (
    <MainLayout>
      <ImportApplications />
    </MainLayout>
  );
};

export const Route = createFileRoute("/import-data")({
  component: RouteComponent,
});
