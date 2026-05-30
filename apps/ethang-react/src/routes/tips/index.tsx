import { Flex, Heading } from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import map from "lodash/map";

import { InternalLink } from "../../components/internal-link.tsx";
import { MainLayout } from "../../components/layout/main-layout.tsx";

const allTips = [
  { href: "/tips/scroll-containers", title: "Easy Sticky Header/Footer" },
  { href: "/tips/scrollbar-gutter", title: "scrollbar-gutter" }
];

const RouteComponent = () => {
  return (
    <MainLayout>
      <Heading as="h1" size="8">
        Tips
      </Heading>
      <Flex asChild direction="column" gap="4" my="6">
        <ul>
          {map(allTips, (tip) => {
            return (
              <li key={tip.href}>
                <Heading as="h2" size="6">
                  <InternalLink href={tip.href}>{tip.title}</InternalLink>
                </Heading>
              </li>
            );
          })}
        </ul>
      </Flex>
    </MainLayout>
  );
};

export const Route = createFileRoute("/tips/")({
  component: RouteComponent
});