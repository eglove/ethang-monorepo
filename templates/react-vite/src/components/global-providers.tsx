import { HeroUIProvider } from "@heroui/react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import constant from "lodash/constant";
import { lazy } from "react";

const TanStackRouterDevtools =
  "production" === import.meta.env.MODE
    ? constant(null)
    : lazy(async () =>
        import("@tanstack/react-router-devtools").then((response) => ({
          default: response.TanStackRouterDevtools,
        })),
      );

export const GlobalProviders = () => {
  const navigate = useNavigate();

  return (
    <>
      <HeroUIProvider
        navigate={(url) => {
          navigate({ to: url }).catch(globalThis.console.error);
        }}
      >
        <Outlet />
      </HeroUIProvider>
      <TanStackRouterDevtools />
    </>
  );
};
