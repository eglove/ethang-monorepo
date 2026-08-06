import { TopNavItem } from "@astryxdesign/core";
import { Array } from "effect";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/tips", label: "Tips" },
  { href: "/courses", label: "Courses" },
  { href: "/rss", label: "RSS" }
];

export const NavigationItems = () => {
  return (
    <>
      {Array.map(navigationItems, (navigationItem) => {
        return (
          <div className="px-2">
            <TopNavItem
              href={navigationItem.href}
              key={navigationItem.label}
              label={navigationItem.label}
            />
          </div>
        );
      })}
    </>
  );
};
