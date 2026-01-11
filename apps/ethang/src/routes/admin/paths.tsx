import { redirect } from "@tanstack/react-router";
import includes from "lodash/includes.js";

import { AdminPaths } from "../../components/admin/paths/admin-paths.tsx";
import { MainLayout } from "../../components/main-layout.tsx";

const PathsPage = () => {
  return (
    <MainLayout>
      <AdminPaths />
    </MainLayout>
  );
};

export const Route = createFileRoute({
  beforeLoad: () => {
    const isAuthenticated = includes(document.cookie, "ethang-auth-token");

    if (!isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({
        search: { redirect: location.href },
        to: "/admin",
      });
    }
  },
  component: PathsPage,
});
