import isNil from "lodash/isNil.js";
import { StrictMode } from "react";

import "./index.css";
import { createRoot } from "react-dom/client";

import { App } from "./app.tsx";

const root = document.querySelector("#root");

if (!isNil(root)) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
