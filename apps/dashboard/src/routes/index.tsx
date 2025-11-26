import { createFileRoute } from "@tanstack/react-router";

import { NavTabs } from "../components/nav-tabs.tsx";

const Index = () => {
  return (
    <div>
      <NavTabs />
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
