import { createRouter, RouterProvider } from "@tanstack/react-router";
import isNil from "lodash/isNil.js";

import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // @ts-expect-error global types
  type Register = {
    router: typeof router;
  };
}

const root = document.querySelector("#root");

if (!isNil(root)) {
  createRoot(root).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
