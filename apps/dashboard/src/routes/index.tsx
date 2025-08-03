import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";
import { NavigationCard } from "../components/navigation-card.tsx";

const Index = () => {
  return (
    <MainLayout>
      <div className="grid gap-4 md:grid-cols-3">
        <NavigationCard
          description="Keep track of your job applications and Q/A's."
          href="/job-search"
          title="Job Search"
        />
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
