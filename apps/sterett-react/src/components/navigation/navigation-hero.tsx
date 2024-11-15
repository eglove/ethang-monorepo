import { NavbarContent, NavbarMenuToggle } from "@nextui-org/navbar";

import { NavigationHome } from "./navigation-home.tsx";

type NavigationHeroProperties = {
  readonly isMenuOpen: boolean;
};

export const NavigationHero = ({ isMenuOpen }: NavigationHeroProperties) => {
  return (
    <NavbarContent className="pl-0">
      <NavbarMenuToggle
        aria-label={isMenuOpen
          ? "Close menu"
          : "Open menu"}
        className="text-foreground md:hidden"
      />
      <NavigationHome />
    </NavbarContent>
  );
};
