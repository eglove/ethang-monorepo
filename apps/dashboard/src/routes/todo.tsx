import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";
import { SectionHeader } from "../section-header.tsx";

const Todo = () => {
  return (
    <MainLayout>
      <SectionHeader
        header="Todos"
        modalKey="createTodo"
        modalLabel="Add Todo"
      />
    </MainLayout>
  );
};

export const Route = createFileRoute("/todo")({
  component: Todo,
});
