// eslint-disable-next-line react/naming-convention/filename
import "../index.css";

import "react-toastify/dist/ReactToastify.css";
import { createRootRoute, Outlet } from "@tanstack/react-router";

import { Providers } from "../components/providers.tsx";

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
