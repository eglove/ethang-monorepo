import { ImportApplications } from "@/components/add-edit-application/import-applications.tsx";
import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  return <ImportApplications />;
};

export const Route = createFileRoute("/import-data")({
  component: RouteComponent,
});
