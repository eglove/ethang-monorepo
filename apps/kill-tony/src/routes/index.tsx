import { createFileRoute } from "@tanstack/react-router";

import { Episodes } from "../components/episode/episodes.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";

const Index = () => {
  return (
    <MainLayout>
      <Episodes />
    </MainLayout>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
