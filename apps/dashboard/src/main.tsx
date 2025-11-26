import { HeroUIProvider } from "@heroui/react";
import {
  createRouter,
  type NavigateOptions,
  RouterProvider,
  type ToOptions,
} from "@tanstack/react-router";
import isNil from "lodash/isNil.js";
import { StrictMode } from "react";

import "./index.css";
import { createRoot } from "react-dom/client";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // @ts-expect-error global definition
  type Register = {
    router: typeof router;
  };
}

declare module "@react-types/shared" {
  // @ts-expect-error global definition
  type RouterConfig = {
    href: ToOptions["to"];
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  };
}

const rootElement = document.querySelector("#root");

if (!isNil(rootElement)) {
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <HeroUIProvider
        navigate={async (to) => {
          return router.navigate({ to }).catch(globalThis.console.error);
        }}
        useHref={(to) => {
          return router.buildLocation({ to }).href;
        }}
      >
        <RouterProvider router={router} />
      </HeroUIProvider>
    </StrictMode>,
  );
}
