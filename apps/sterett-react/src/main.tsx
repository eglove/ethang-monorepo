import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";

import "./index.css";

import ReactDOM from "react-dom/client";

import { router } from "./routes/route-tree.ts";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(globalThis.document.querySelector("#root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
