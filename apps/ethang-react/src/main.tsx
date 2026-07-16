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

/**
Mounts the React app into the document's `#root` element. Exported
for tests so they can drive the bootstrap behaviour directly without relying
on side-effect imports.
*/
export const mountApp = () => {
  const rootElement = document.querySelector("#root");

  if (!isNil(rootElement)) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );
  }
};

mountApp();
