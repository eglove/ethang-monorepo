import { createFileRoute } from "@tanstack/solid-router";

import { MainLayout } from "~/components/layouts/main-layout.tsx";

const RouteComponent = () => {
  return <MainLayout>Hello "/workout"!</MainLayout>;
};

export const Route = createFileRoute("/workout")({
  component: RouteComponent,
});
