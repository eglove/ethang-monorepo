import { Navbar, NavbarContent, NavbarMenu } from "@nextui-org/navbar";
import { useCallback, useState } from "react";

import { NavigationHero } from "./navigation-hero.tsx";
import { NavigationLinks } from "./navigation-links.tsx";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleIsOpen = useCallback((isOpen: boolean): void => {
    setIsMenuOpen(isOpen);
  }, []);

  return (
    <Navbar
      className="mx-auto max-w-7xl rounded-lg bg-white shadow-md shadow-sky-50"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={toggleIsOpen}
    >
      <NavigationHero isMenuOpen={isMenuOpen} />
      <NavbarContent className="hidden gap-4 md:flex md:flex-wrap">
        <NavigationLinks />
      </NavbarContent>
      <NavbarMenu className="mt-4 rounded-lg">
        <NavigationLinks />
      </NavbarMenu>
    </Navbar>
  );
};
