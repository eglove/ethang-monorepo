import { createRouter, RouterProvider } from "@tanstack/react-router";
import isNil from "lodash/isNil.js";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";

import { routeTree } from "./routeTree.gen";
import "./index.css";

// Create a new router instance
const router = createRouter({
  defaultPreload: "viewport",
  defaultPreloadStaleTime: 0,
  routeTree,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  // @ts-expect-error globals
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
    </StrictMode>,
  );
}
