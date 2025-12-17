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
  { href: "/blog", label: "Blog" },
  { href: "/tips", label: "Tips" },
  { href: "/projects", label: "Projects" },
  { href: "/courses", label: "Courses" },
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
          className="sm:hidden"
          aria-label={isNavMenuOpen ? "Close Menu" : "Open Menu"}
        />
        <NavbarContent justify="start" />
        <NavbarContent justify="center" className="hidden gap-4 sm:flex">
          {map(links, (link) => {
            return (
              <NavbarMenuItem key={link.label}>
                <Link
                  href={link.href}
                  underline="always"
                  className="text-foreground"
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
                  href={link.href}
                  underline="always"
                  className="text-foreground"
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
