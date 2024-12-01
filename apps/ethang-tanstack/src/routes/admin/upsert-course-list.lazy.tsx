import { UpsertCourseForm } from "@/components/admin/upsert-course-form.tsx";
import { MainLayout } from "@/components/layouts/main-layout.tsx";
import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { createLazyFileRoute } from "@tanstack/react-router";

const RouteComponent = () => {
  return (
    <MainLayout>
      <TypographyH1 className="mb-4">
        Create Course
      </TypographyH1>
      <UpsertCourseForm />
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/admin/upsert-course-list")({
  component: RouteComponent,
});
