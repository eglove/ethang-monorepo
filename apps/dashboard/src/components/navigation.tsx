import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
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
import { useState } from "react";

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Navbar onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
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
          <SignedOut>
            <SignInButton>
              <Button color="primary">Sign In</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};
