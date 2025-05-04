import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import App from "./app.tsx";
import { GlobalProviders } from "./components/global-providers.tsx";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(globalThis.document.querySelector("#root")!).render(
  <StrictMode>
    <GlobalProviders>
      <App />
    </GlobalProviders>
  </StrictMode>,
);
