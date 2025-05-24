import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";

const RouteComponent = () => {
  return (
    <MainLayout>
      <div className="flex justify-between items-center my-4">
        <div className="prose">
          <h2 className="text-foreground">Job Search</h2>
        </div>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/job-search")({
  component: RouteComponent,
});
