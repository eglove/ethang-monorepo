/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./app";

const root = document.querySelector("#root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?",
  );
}

render(() => {
  return <App />;
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
}, root!);