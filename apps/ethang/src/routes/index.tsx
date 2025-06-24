import { MainLayout } from "../components/main-layout.tsx";
import { NewsSummary } from "../components/news/news-summary.tsx";
import { ProjectSummary } from "../components/projects/project-summary.tsx";
import { TopCard } from "../components/top-card.tsx";

const Index = () => {
  return (
    <MainLayout>
      <div className="grid gap-8">
        <div>
          <TopCard />
        </div>
        <div>
          <ProjectSummary />
        </div>
        <div>
          <NewsSummary />
        </div>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: Index,
});
