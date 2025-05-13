import {
  Button,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/react";
import map from "lodash/map.js";
import { CircleIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { SignInModal } from "@/components/common/sign-in-modal.tsx";
import { userStore, useUserStore } from "@/components/stores/user-store.ts";

const navLinks = [
  { label: "Applications", link: "/" },
  { label: "Q/A", link: "/qa" },
  { label: "Stats", link: "/stats" },
  { label: "Global Stats", link: "/global-stats" },
  { label: "Data Backup", link: "/data-backup" },
];

const handleSignOut = () => {
  userStore.set((state) => {
    state.isSignedIn = false;
    state.token = "";
  });
};

export const Navigation = () => {
  const store = useUserStore();
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand className="text-2xl font-bold">Applynetic</NavbarBrand>
      </NavbarContent>
      <NavbarContent className="hidden gap-4 sm:flex" justify="center">
        {map(navLinks, (link) => {
          return (
            <NavbarItem key={link.label}>
              <Link
                className="text-foreground"
                href={link.link}
                underline="hover"
              >
                {link.label}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>
      <NavbarContent justify="end">
        {store.isSignedIn && (
          <NavbarItem className="hidden items-center gap-1 text-success sm:flex">
            <CircleIcon className="size-3 fill-success" /> Online
          </NavbarItem>
        )}
        {!store.isSignedIn && (
          <NavbarItem className="hidden items-center gap-1 text-danger sm:flex">
            <CircleIcon className="size-3 fill-danger" /> Offline
          </NavbarItem>
        )}
        {!store.isSignedIn && (
          <NavbarItem>
            <SignInModal />
          </NavbarItem>
        )}
        {store.isSignedIn && (
          <NavbarItem>
            <Button color="primary" onPress={handleSignOut} size="sm">
              Sign Out
            </Button>
          </NavbarItem>
        )}
        {"dark" === theme.resolvedTheme && (
          <Button
            isIconOnly
            onPress={() => {
              theme.setTheme("light");
            }}
            size="sm"
          >
            <SunIcon />
          </Button>
        )}
        {"light" === theme.resolvedTheme && (
          <Button
            isIconOnly
            onPress={() => {
              theme.setTheme("dark");
            }}
            size="sm"
          >
            <MoonIcon />
          </Button>
        )}
      </NavbarContent>
      <NavbarMenu className="justify-between">
        <div>
          {map(navLinks, (link) => {
            return (
              <NavbarMenuItem key={link.label}>
                <Link href={link.link} underline="hover">
                  {link.label}
                </Link>
              </NavbarMenuItem>
            );
          })}
        </div>
        <div>
          <NavbarMenuItem>
            {store.isSignedIn && (
              <div className="flex items-center gap-1 text-success">
                <CircleIcon className="size-3 fill-success" /> Online
              </div>
            )}
            {!store.isSignedIn && (
              <div className="flex items-center gap-1 text-danger">
                <CircleIcon className="size-3 fill-danger" /> Offline
              </div>
            )}
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </Navbar>
  );
};
