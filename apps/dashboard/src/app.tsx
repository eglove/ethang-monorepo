import { RouterProvider } from "@tanstack/solid-router";

import { router } from "./router";
import "./app.css";

const App = () => <RouterProvider router={router} />;

export default App;
