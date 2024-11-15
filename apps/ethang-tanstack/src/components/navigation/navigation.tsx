import { useObservable } from "@legendapp/state/react";
import { Avatar } from "@nextui-org/avatar";
import { Link } from "@nextui-org/link";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuToggle } from "@nextui-org/navbar";

import { NavigationItems } from "./navigation-links";

export const Navigation = () => {
  const isMenuOpen = useObservable(false);

  return (
    <Navbar
      onMenuOpenChange={() => {
        isMenuOpen.set(!isMenuOpen.get());
      }}
      className="mx-auto max-w-screen-xl"
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen.get()
            ? "Close Menu"
            : "Open Menu"}
          className="sm:hidden"
        />
        <NavbarItem>
          <NavbarBrand className="hidden text-xl font-bold sm:block">
            Ethan Glover
          </NavbarBrand>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent
        className="hidden sm:flex"
        justify="center"
      >
        <NavigationItems />
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Link
            isExternal
            href="https://github.com/eglove"
          >
            <Avatar
              isBordered
              color="primary"
              name="GitHub"
              size="sm"
              src="https://cdn.sanity.io/images/j1gcump7/production/48eaa6c167e92488cfda573ff9734e8673612893-32x32.svg"
            />
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link
            isExternal
            href="https://www.linkedin.com/in/ethan-glover/"
          >
            <Avatar
              isBordered
              color="secondary"
              name="LinkedIn"
              size="sm"
              src="https://cdn.sanity.io/images/j1gcump7/production/5c36bae42fcf740d388d5870e283778846425098-550x550.svg"
            />
          </Link>
        </NavbarItem>
      </NavbarContent>
      <NavbarMenu className="z-40">
        <NavbarItem className="text-xl font-bold">
          Ethan Glover
        </NavbarItem>
        <NavigationItems />
      </NavbarMenu>
    </Navbar>
  );
};
