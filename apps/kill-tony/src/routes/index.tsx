import { createFileRoute } from "@tanstack/react-router";

import { Episodes } from "../components/episode/episodes.tsx";

const Index = () => {
  return <Episodes />;
};

export const Route = createFileRoute("/")({
  component: Index,
});
