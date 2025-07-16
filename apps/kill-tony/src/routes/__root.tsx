// eslint-disable-next-line react/naming-convention/filename
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export const Route = createRootRoute({
  component: () => (
    <HeroUIProvider>
      <ToastProvider />
      <Outlet />
      <TanStackRouterDevtools />
    </HeroUIProvider>
  ),
});
