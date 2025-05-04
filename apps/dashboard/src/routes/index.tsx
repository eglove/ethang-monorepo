import { createFileRoute } from "@tanstack/solid-router";

const RouteComponent = () => (
  <main>
    <h1>Hello world!</h1>
    <p>
      Visit{" "}
      <a href="https://start.solidjs.com" target="_blank">
        start.solidjs.com
      </a>{" "}
      to learn how to build SolidStart apps.
    </p>
  </main>
);

export const Route = createFileRoute("/")({
  component: RouteComponent,
});
