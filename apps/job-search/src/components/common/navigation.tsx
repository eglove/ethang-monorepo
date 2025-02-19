import { SignInModal } from "@/components/common/sign-in-modal.tsx";
import { userStore, useUserStore } from "@/components/stores/user-store.ts";
import { logger } from "@/lib/logger.ts";
import { backupAllData } from "@/lib/sync-requests.ts";
import { useOnline } from "@ethang/hooks/use-online.js";
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

const navLinks = [
  { label: "Applications", link: "/" },
  { label: "Q/A", link: "/qa" },
  { label: "Stats", link: "/stats" },
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
  const { isOnline } = useOnline({
    onOnline: () => {
      backupAllData()
        .then(() => {
          logger.info("Backup successful");
        })
        .catch(logger.error);
    },
  });

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>Job Track</NavbarBrand>
      </NavbarContent>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
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
        {isOnline && (
          <NavbarItem className="items-center text-success gap-1 hidden sm:flex">
            <CircleIcon className="size-3 fill-success" /> Online
          </NavbarItem>
        )}
        {!isOnline && (
          <NavbarItem className="items-center text-danger gap-1 hidden sm:flex">
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
            {isOnline && (
              <div className="items-center text-success gap-1 flex">
                <CircleIcon className="size-3 fill-success" /> Online
              </div>
            )}
            {!isOnline && (
              <div className="flex items-center text-danger gap-1">
                <CircleIcon className="size-3 fill-danger" /> Offline
              </div>
            )}
          </NavbarMenuItem>
        </div>
      </NavbarMenu>
    </Navbar>
  );
};
