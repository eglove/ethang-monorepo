import { Heading, Link, Text } from "@astryxdesign/core";
import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../components/layouts/main-layout.tsx";

export const Route = createFileRoute("/$")({
  component: NotFoundPage
});

function NotFoundPage() {
  return (
    <MainLayout>
      <Heading level={1}>404</Heading>
      <Text as="p">Page not found</Text>
      <br />
      <Link href="/">Return home</Link>
    </MainLayout>
  );
}
