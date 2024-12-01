// eslint-disable-next-line react/naming-convention/filename
import { createRootRoute, Outlet } from "@tanstack/react-router";

// @ts-expect-error it's css
import "../index.css";

// @ts-expect-error it's css
import "@ethang/react-components/src/index.css";

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
