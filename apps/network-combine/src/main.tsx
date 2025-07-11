import isNil from "lodash/isNil.js";
import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./app.tsx";

const root = document.querySelector("#root");

if (!isNil(root)) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
