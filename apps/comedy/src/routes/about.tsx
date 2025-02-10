import { createFileRoute } from "@tanstack/react-router";

const About = () => <div className="p-2">Hello from About!</div>;

export const Route = createFileRoute("/about")({
  component: About,
});
