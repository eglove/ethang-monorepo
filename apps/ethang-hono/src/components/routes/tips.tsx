import map from "lodash/map.js";

import { MainLayout } from "../layouts/main-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { H2 } from "../typography/h2.tsx";
import { Link } from "../typography/link.tsx";
import { List } from "../typography/list.tsx";

export const allTips = [
  {
    href: "/tips/scroll-containers",
    title: "Easy Sticky Header/Footer",
  },
  { href: "/tips/scrollbar-gutter", title: "scrollbar-gutter" },
];

export const Tips = async () => {
  return (
    <MainLayout classNames={{ main: "max-w-[65ch] mx-auto" }}>
      <H1>Tips</H1>
      <List className="my-4">
        {map(allTips, async (tip) => {
          return (
            <li>
              <H2>
                <Link href={tip.href}>{tip.title}</Link>
              </H2>
            </li>
          );
        })}
      </List>
    </MainLayout>
  );
};
