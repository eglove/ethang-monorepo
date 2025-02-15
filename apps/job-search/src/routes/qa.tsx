import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { AddQaForm } from "@/components/qa/add-qa-form.tsx";
import { QaList } from "@/components/qa/qa-list.tsx";
import { createFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  return (
    <MainLayout>
      <AddQaForm />
      <QaList />
    </MainLayout>
  );
};

export const Route = createFileRoute("/qa")({
  component: RouteComponent,
});
