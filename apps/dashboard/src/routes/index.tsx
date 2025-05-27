import { useUser } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";

import { HomeNavigationCard } from "../components/home-navigation-card.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { queryKeys } from "../data/queries/queries.ts";

const Index = () => {
  const { user } = useUser();

  return (
    <MainLayout>
      <div className="grid md:grid-cols-3 gap-4">
        <HomeNavigationCard
          description="Keep track of your todos."
          href="/todo"
          queryKey={[]}
          title="Todos"
        />
        <HomeNavigationCard
          description="Keep all your favorite links in one convenient place for easy
              access anytime."
          href="/bookmarks"
          queryKey={queryKeys.bookmarks(user?.id)}
          title="Bookmarks"
        />
        <HomeNavigationCard
          description="Keep track of your job applications and Q/A's."
          href="/job-search"
          queryKey={queryKeys.applications(user?.id)}
          title="Job Search"
        />
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
