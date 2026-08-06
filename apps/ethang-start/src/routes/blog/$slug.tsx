import { Heading } from "@astryxdesign/core";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { SanityText } from "../../components/sanity-text.tsx";
import { getBlogBySlug } from "../../models/blog.ts";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogDetail,
  loader: async ({ params }) => {
    return getBlogBySlug({ data: { slug: params.slug } });
  }
});

function BlogDetail() {
  const data = useLoaderData({ from: Route.id });

  return (
    <MainLayout>
      <Heading level={1}>{data.title}</Heading>
      <SanityText value={data.body} />
    </MainLayout>
  );
}
