import { clientOnly } from "@solidjs/start";
import { createRootRoute, Outlet } from "@tanstack/solid-router";
import { Suspense } from "solid-js";

const Devtools = clientOnly(
  async () => import("../components/development-tools.tsx"),
);

const RootComponent = () => {
  return (
    <Suspense>
      <Outlet />
      <Devtools />
    </Suspense>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
