import { createRouter, RouterProvider } from "@tanstack/react-router";
import isNil from "lodash/isNil";

import "./index.css";

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { routeTree } from "./routeTree.gen";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  // @ts-expect-error declare global type
  type Register = {
    router: typeof router;
  };
}

const rootElement = globalThis.document.querySelector("#root");
if (!isNil(rootElement) && !isNil(rootElement.innerHTML)) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}
