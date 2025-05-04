import { createRouter, RouterProvider } from "@tanstack/react-router";
import isNil from "lodash/isNil.js";
import { StrictMode } from "react";

import "./index.css";

import { createRoot } from "react-dom/client";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // @ts-expect-error global type
  type Register = {
    router: typeof router;
  };
}

const rootElement = globalThis.document.querySelector("#root");

if (!isNil(rootElement)) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
