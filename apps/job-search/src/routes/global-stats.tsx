import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  return (
    <MainLayout>
      <div>
        <p>global stats</p>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/global-stats")({
  component: RouteComponent,
});
