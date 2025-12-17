import { NavbarContent, NavbarMenuToggle } from "@heroui/react";

import { NavigationHome } from "./navigation-home.tsx";

type NavigationHeroProperties = {
  readonly isMenuOpen: boolean;
};

export const NavigationHero = ({ isMenuOpen }: NavigationHeroProperties) => {
  return (
    <NavbarContent className="pl-0">
      <NavbarMenuToggle
        className="text-foreground md:hidden"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
      />
      <NavigationHome />
    </NavbarContent>
  );
};
