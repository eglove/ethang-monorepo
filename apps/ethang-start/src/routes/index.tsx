import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";
import { ProfileCard } from "../components/profile-card.tsx";

export const Route = createFileRoute("/")({
  component: App
});

function App() {
  return (
    <MainLayout>
      <div className="mt-6 flex gap-4">
        <ProfileCard />
      </div>
    </MainLayout>
  );
}
