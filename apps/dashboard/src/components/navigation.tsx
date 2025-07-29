import { useStore } from "@ethang/store/use-store";
import {
  Button,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuToggle,
} from "@heroui/react";
import { LogOutIcon } from "lucide-react";
import { useState } from "react";

import { authStore } from "../stores/auth-store.ts";
import { SignInModal } from "./auth/sign-in-modal.tsx";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isSignedIn } = useStore(authStore, (state) => {
    return {
      isSignedIn: state.isSignedIn,
    };
  });

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
          className="cursor-pointer"
        />
        <NavbarBrand className="font-bold">
          <Link className="text-foreground" href="/">
            Dashboard
          </Link>
        </NavbarBrand>
      </NavbarContent>
      <NavbarMenu>
        <NavbarItem>
          <Link className="text-foreground" href="/todo" underline="hover">
            Todos
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link className="text-foreground" href="/bookmarks" underline="hover">
            Bookmarks
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link
            className="text-foreground"
            href="/job-search"
            underline="hover"
          >
            Applications
          </Link>
        </NavbarItem>
        <NavbarItem className="ml-4">
          <Link
            className="text-foreground"
            href="/job-search/qa"
            underline="hover"
          >
            Q/A
          </Link>
        </NavbarItem>
        <NavbarItem className="ml-4">
          <Link
            className="text-foreground"
            href="/job-search/contact"
            underline="hover"
          >
            Contacts
          </Link>
        </NavbarItem>
        <NavbarItem className="ml-4">
          <Link
            className="text-foreground"
            href="/job-search/stats"
            underline="hover"
          >
            Stats
          </Link>
        </NavbarItem>
      </NavbarMenu>
      <NavbarContent justify="end">
        <NavbarItem>
          {isSignedIn ? (
            <Button
              isIconOnly
              onPress={() => {
                authStore.signOut();
              }}
              aria-label="Sign Out"
              color="danger"
              size="sm"
            >
              <LogOutIcon />
            </Button>
          ) : (
            <SignInModal />
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};
