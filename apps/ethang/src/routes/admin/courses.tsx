import { redirect } from "@tanstack/react-router";
import includes from "lodash/includes.js";

import { AdminCourses } from "../../components/admin/courses/admin-courses.tsx";
import { MainLayout } from "../../components/main-layout.tsx";

export const Route = createFileRoute({
  beforeLoad: () => {
    const isAuthenticated = includes(document.cookie, "ethang-auth-token");

    if (!isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        search: {
          redirect: location.href,
        },
        to: "/admin",
      });
    }
  },
  component: () => (
    <MainLayout>
      <AdminCourses />
    </MainLayout>
  ),
});
