import { createFileRoute } from "@tanstack/react-router";

import { NavTabs } from "../components/nav-tabs.tsx";
import { VideoCards } from "../components/video-cards.tsx";

const Index = () => {
  return (
    <div>
      <NavTabs />
      <VideoCards />
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
