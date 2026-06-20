import { createRouter, RouterProvider } from "@tanstack/react-router";
import isNil from "lodash/isNil.js";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import "./style.css";
import "@radix-ui/themes/styles.css";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // @ts-expect-error global
  type Register = {
    router: typeof router;
  };
}

const rootElement = document.querySelector("#root");

if (!isNil(rootElement)) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
