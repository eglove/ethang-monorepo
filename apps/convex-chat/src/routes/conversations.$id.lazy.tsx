import { createLazyFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";

const RouteComponent = () => {
  return (
    <MainLayout>
      conversation id
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/conversations/$id")({
  component: RouteComponent,
});
