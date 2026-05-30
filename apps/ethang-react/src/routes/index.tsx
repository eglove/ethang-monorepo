import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layout/main-layout.tsx";
import { ProfileCard } from "../components/profile-card.tsx";

const Index = () => {
  return (
    <MainLayout>
      <ProfileCard />
    </MainLayout>
  );
};

export const Route = createFileRoute("/")({
  component: Index
});
