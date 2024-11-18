import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "@nextui-org/link";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@nextui-org/navbar";
import { useLocation } from "@tanstack/react-router";
import { Authenticated, Unauthenticated } from "convex/react";
import map from "lodash/map.js";
import { twMerge } from "tailwind-merge";

import { Notifications } from "./notifications.tsx";

const links = [
  {
    href: "/conversations",
    label: "Conversations",
  },
  {
    href: "/friends",
    label: "Friends",
  },
];

export const Navigation = () => {
  const location = useLocation();

  return (
    <Navbar>
      <NavbarBrand>
        <h1 className="text-2xl font-bold">
          Chat
        </h1>
      </NavbarBrand>
      <NavbarContent
        className="hidden gap-4 sm:flex"
        justify="center"
      >
        {map(links, (link) => {
          return (
            <NavbarItem key={link.href}>
              <Link
                className={twMerge(location.pathname === link.href && "underline underline-offset-2")}
                color="foreground"
                href={link.href}
              >
                {link.label}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>
      <NavbarContent justify="end">
        <NavbarItem>
          <Authenticated>
            <UserButton />
          </Authenticated>
          <Unauthenticated>
            <SignInButton />
          </Unauthenticated>
        </NavbarItem>
        <NavbarItem>
          <Notifications />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};
