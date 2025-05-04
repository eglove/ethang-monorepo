import { RouterProvider } from "@tanstack/solid-router";
import "@fontsource/inter";

import "./app.css";
import { router } from "./router";

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
