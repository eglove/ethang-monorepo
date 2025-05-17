import { useUser } from "@clerk/clerk-react";
import { Card, CardBody, CardHeader, Link } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";
import { queryKeys } from "../data/queries/queries.ts";

const Index = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return (
    <MainLayout>
      <div className="grid md:grid-cols-3">
        <Link
          onMouseEnter={() => {
            queryClient
              .prefetchQuery({
                queryKey: queryKeys.bookmarks(user?.id),
              })
              .catch(globalThis.console.error);
          }}
          href="/bookmarks"
        >
          <Card>
            <CardHeader className="prose">
              <h2 className="text-foreground">Bookmarks</h2>
            </CardHeader>
            <CardBody>
              Keep all your favorite links in one convenient place for easy
              access anytime.
            </CardBody>
          </Card>
        </Link>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute("/")({
  component: Index,
});
