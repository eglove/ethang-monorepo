import { createRouter, RouterProvider } from "@tanstack/react-router";
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

const root = globalThis.document.querySelector("#root");

if (!isNil(root)) {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
