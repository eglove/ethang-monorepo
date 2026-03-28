import map from "lodash/map.js";

import { globalStore } from "../../stores/global-store-properties.ts";
import { NavigationButton } from "./navigation-button.tsx";
import { NavigationLink } from "./navigation-link.tsx";

const navigationLinks = [
  { href: "/", title: "Home" },
  { href: "/blog", title: "Blog" },
  { href: "/tips", title: "Tips" },
  { href: "/courses", title: "Courses" },
];

export const Navigation = async () => {
  return (
    <nav class="fixed inset-s-0 top-0 z-20 w-full border-b border-default bg-neutral-primary">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between p-4">
        <NavigationButton />
        <div id="navbar-default" class="hidden w-full md:block md:w-auto">
          <ul class="mt-4 flex flex-col rounded-base border border-default bg-neutral-secondary-soft p-4 font-medium md:mt-0 md:flex-row md:space-x-8 md:border-0 md:bg-neutral-primary md:p-0 rtl:space-x-reverse">
            {map(navigationLinks, async (link) => {
              return (
                <li>
                  <NavigationLink
                    href={link.href}
                    pathname={globalStore.pathname}
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
