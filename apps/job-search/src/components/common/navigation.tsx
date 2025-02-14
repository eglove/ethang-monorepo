import { Link } from "@tanstack/react-router";
import map from "lodash/map.js";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "../ui/navigation-menu";

const navLinks = [
  { label: "Applications", link: "/" },
  { label: "Q/A", link: "/" },
  { label: "Stats", link: "/" },
  { label: "Data Backup", link: "/" },
];

export const Navigation = () => {
  return (
    <div className="flex justify-center">
      <NavigationMenu>
        <NavigationMenuList className="flex gap-4">
          {map(navLinks, (link) => {
            return (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link className="underline underline-offset-2" to={link.link}>
                    {link.label}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};
