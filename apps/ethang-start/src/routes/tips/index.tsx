import { Heading, Link } from "@astryxdesign/core";
import { createFileRoute } from "@tanstack/react-router";

import { MainLayout } from "../../components/layouts/main-layout.tsx";

const allTips = [
  { href: "/tips/scroll-containers", title: "Easy Sticky Header/Footer" },
  { href: "/tips/scrollbar-gutter", title: "scrollbar-gutter" }
];

export const Route = createFileRoute("/tips/")({
  component: TipsIndex
});

function TipsIndex() {
  return (
    <MainLayout>
      <Heading level={1}>Tips</Heading>
      <ul className="my-6 flex list-disc flex-col gap-4 pl-5">
        {allTips.map((tip) => (
          <li key={tip.href}>
            <Heading level={2}>
              <Link href={tip.href}>{tip.title}</Link>
            </Heading>
          </li>
        ))}
      </ul>
    </MainLayout>
  );
}
