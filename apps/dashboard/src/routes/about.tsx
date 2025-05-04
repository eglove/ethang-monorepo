import { createFileRoute } from "@tanstack/solid-router";

const RouteComponent = () => (
  <main>
    <h1>About</h1>
  </main>
);

export const Route = createFileRoute("/about")({
  component: RouteComponent,
});
