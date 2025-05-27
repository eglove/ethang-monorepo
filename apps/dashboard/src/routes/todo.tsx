import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";

const Todo = () => {
  return <MainLayout>Coming Soon</MainLayout>;
};

export const Route = createFileRoute("/todo")({
  component: Todo,
});
