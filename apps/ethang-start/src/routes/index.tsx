import { createFileRoute } from "@tanstack/react-router";

import { Navigation } from "../components/navigation.tsx";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return <Navigation />;
}
