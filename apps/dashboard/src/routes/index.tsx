import { createFileRoute } from "@tanstack/react-router";

import { HomeNavigationCard } from "../components/home-navigation-card.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";

const Index = () => {
  return (
    <MainLayout>
      <div className="grid md:grid-cols-3 gap-4">
        <HomeNavigationCard
          description="Keep track of your todos."
          href="/todo"
          title="Todos"
        />
        <HomeNavigationCard
          description="Keep all your favorite links in one convenient place for easy
              access anytime."
          href="/bookmarks"
          title="Bookmarks"
        />
        <HomeNavigationCard
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
