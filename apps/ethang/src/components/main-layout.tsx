import type { PropsWithChildren } from "react";

import { useStore } from "@ethang/store/use-store";
import {
  Link,
  Navbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/react";
import map from "lodash/map.js";
import { twMerge } from "tailwind-merge";

import { globalStore } from "../stores/global-store.ts";

const links = [
  { href: "/", label: "Home" },
  { href: "/tips", label: "Tips" },
  { href: "/projects", label: "Projects" },
  { href: "/courses", label: "Courses" },
  { href: "/news", label: "News" },
];

type MainLayoutProperties = {
  className?: string;
};

export const MainLayout = ({
  children,
  className,
}: Readonly<PropsWithChildren<MainLayoutProperties>>) => {
  const isNavMenuOpen = useStore(globalStore, (state) => state.isNavMenuOpen);

  return (
    <div className={twMerge("p-4 max-w-7xl mx-auto", className)}>
      <Navbar
        onMenuOpenChange={(value) => {
          globalStore.setIsNavMenuOpen(value);
        }}
      >
        <NavbarMenuToggle
          aria-label={isNavMenuOpen ? "Close Menu" : "Open Menu"}
          className="sm:hidden"
        />
        <NavbarContent justify="start" />
        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          {map(links, (link) => {
            return (
              <NavbarMenuItem key={link.label}>
                <Link
                  className="text-foreground"
                  href={link.href}
                  underline="always"
                >
                  {link.label}
                </Link>
              </NavbarMenuItem>
            );
          })}
        </NavbarContent>
        <NavbarContent justify="end" />
        <NavbarMenu>
          {map(links, (link) => {
            return (
              <NavbarMenuItem>
                <Link
                  className="text-foreground"
                  href={link.href}
                  underline="always"
                >
                  {link.label}
                </Link>
              </NavbarMenuItem>
            );
          })}
        </NavbarMenu>
      </Navbar>
      {children}
    </div>
  );
};
