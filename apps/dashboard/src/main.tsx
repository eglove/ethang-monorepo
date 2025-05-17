import { createRouter, RouterProvider } from "@tanstack/react-router";
import isNil from "lodash/isNil.js";

import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // @ts-expect-error globals
  type Register = {
    router: typeof router;
  };
}

const rootElement = globalThis.document.querySelector("#root");

if (!isNil(rootElement)) {
  createRoot(rootElement).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
