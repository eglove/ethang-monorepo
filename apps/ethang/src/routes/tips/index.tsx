import { Link } from "@heroui/react";
import map from "lodash/map.js";

import { MainLayout } from "../../components/main-layout.tsx";
import { TypographyH1 } from "../../components/typography/typography-h1.tsx";
import { TypographyList } from "../../components/typography/typography-list.tsx";

export const allTips = [
  {
    href: "/tips/fine-grained-react-renders",
    title: "Fine Grained React Renders",
  },
  {
    href: "/tips/scroll-containers",
    title: "Easy Sticky Header/Footer",
  },
  { href: "/tips/scrollbar-gutter", title: "scrollbar-gutter" },
];

const RouteComponent = () => {
  return (
    <MainLayout className="max-w-[65ch]">
      <TypographyH1>Tips</TypographyH1>
      <TypographyList>
        {map(allTips, (tip) => {
          return (
            <li key={tip.title}>
              <Link
                className="text-foreground"
                href={tip.href}
                underline="always"
              >
                {tip.title}
              </Link>
            </li>
          );
        })}
      </TypographyList>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
