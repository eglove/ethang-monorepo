import { Card, CardBody, CardHeader, Link } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";

const Index = () => (
  <MainLayout>
    <div className="grid md:grid-cols-3">
      <Link href="/bookmarks">
        <Card>
          <CardHeader className="prose">
            <h2 className="text-foreground">Bookmarks</h2>
          </CardHeader>
          <CardBody>
            Keep all your favorite links in one convenient place for easy access
            anytime.
          </CardBody>
        </Card>
      </Link>
    </div>
  </MainLayout>
);

export const Route = createFileRoute("/")({
  component: Index,
});
