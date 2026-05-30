import type { PropsWithChildren } from "react";

import map from "lodash/map";
import { NavigationMenu } from "radix-ui";

import { InternalLink } from "../internal-link.tsx";

const links = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/tips", label: "Tips" },
  { href: "/courses", label: "Courses" }
];

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <>
      <NavigationMenu.Root className="my-4">
        <NavigationMenu.List className="flex flex-wrap gap-4">
          {map(links, (link) => {
            return (
              <NavigationMenu.Link asChild key={link.label}>
                <InternalLink href={link.href}>{link.label}</InternalLink>
              </NavigationMenu.Link>
            );
          })}
        </NavigationMenu.List>
      </NavigationMenu.Root>
      {children}
    </>
  );
};
