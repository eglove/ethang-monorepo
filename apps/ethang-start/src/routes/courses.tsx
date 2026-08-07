import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { CoursesView } from "../components/courses/courses-view.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { getCourses } from "../models/course.ts";

export const Route = createFileRoute("/courses")({
  component: RouteComponent,
  loader: async () => {
    return getCourses();
  }
});

function RouteComponent() {
  const data = useLoaderData({ from: Route.id });

  return (
    <MainLayout>
      <CoursesView courses={data} />
    </MainLayout>
  );
}
