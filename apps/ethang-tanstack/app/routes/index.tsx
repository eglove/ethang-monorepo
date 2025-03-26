import { createFileRoute } from "@tanstack/react-router";

const Home = () => {
  return <button type="button">Add 1 to?</button>;
};

export const Route = createFileRoute("/")({
  component: Home,
});
