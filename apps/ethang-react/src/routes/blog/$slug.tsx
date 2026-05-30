import { Heading } from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useParams } from "@tanstack/react-router";

import { MainLayout } from "../../components/layout/main-layout.tsx";
import { SanityText } from "../../components/sanity-text.tsx";
import { getBlogBySlug } from "../../models/blog-model.ts";

const RouteComponent = () => {
  const { slug } = useParams({ from: "/blog/$slug" });

  const { data } = useQuery(getBlogBySlug(slug));

  console.log(data);

  return (
    <MainLayout>
      <Heading as="h1" size="8">
        {data?.title}
      </Heading>
      <SanityText value={data?.body}></SanityText>
    </MainLayout>
  );
};

export const Route = createFileRoute("/blog/$slug")({
  component: RouteComponent
});
