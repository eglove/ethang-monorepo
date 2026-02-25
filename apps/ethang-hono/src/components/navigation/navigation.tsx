import map from "lodash/map.js";

import { NavigationButton } from "./navigation-button.tsx";
import { NavigationLink } from "./navigation-link.tsx";

type NavigationProperties = {
  pathname: string;
};

const navigationLinks = [
  { href: "/", title: "Home" },
  { href: "/blog", title: "Blog" },
  { href: "/tips", title: "Tips" },
  { href: "/projects", title: "Projects" },
  { href: "/courses", title: "Courses" },
];

export const Navigation = async (properties: NavigationProperties) => {
  return (
    <nav class="bg-neutral-primary w-full inset-s-0 border-b border-default">
      <div class="max-w-7xl flex flex-wrap items-center justify-between mx-auto p-4">
        <NavigationButton />
        <div id="navbar-default" class="hidden w-full md:block md:w-auto">
          <ul class="font-medium flex flex-col p-4 md:p-0 mt-4 border border-default rounded-base bg-neutral-secondary-soft md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-neutral-primary">
            {map(navigationLinks, async (link) => {
              return (
                <li>
                  <NavigationLink
                    href={link.href}
                    pathname={properties.pathname}
                  >
                    {link.title}
                  </NavigationLink>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};
