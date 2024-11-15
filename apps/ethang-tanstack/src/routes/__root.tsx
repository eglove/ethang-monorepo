// eslint-disable-next-line react/naming-convention/filename
import { createRootRoute, Outlet } from "@tanstack/react-router";

import "../index.css";
import { Providers } from "../components/providers";

const RootComponent = () => {
  return (
    <Providers>
      <Outlet />
    </Providers>
  );
};

export const Route = createRootRoute({
  component: RootComponent,
});
