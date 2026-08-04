import { Button, TopNav, TopNavHeading, TopNavItem } from "@astryxdesign/core";
import { Array } from "effect";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/tips", label: "Tips" },
  { href: "/courses", label: "Courses" },
  { href: "/rss", label: "RSS" }
];

export const Navigation = () => {
  return (
    <TopNav
      label="Main navigation"
      className="hidden md:grid"
      heading={<TopNavHeading heading="EthanG" />}
      endContent={
        <div>
          <Button label="Login" variant="primary" />
        </div>
      }
      centerContent={
        <>
          {Array.map(navigationItems, (navigationItem) => {
            return (
              <TopNavItem
                href={navigationItem.href}
                key={navigationItem.label}
                label={navigationItem.label}
              />
            );
          })}
        </>
      }
    />
  );
};
