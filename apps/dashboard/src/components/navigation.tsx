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
} from "@heroui/react";
import { useLocation } from "@tanstack/react-router";
import startsWith from "lodash/startsWith";

export const Navigation = () => {
  const location = useLocation();
  const isJobSearch = startsWith(location.pathname, "/job-search");

  return (
    <Navbar>
      <NavbarBrand className="font-bold">
        <Link className="text-foreground" href="/">
          Dashboard
        </Link>
      </NavbarBrand>
      {isJobSearch && (
        <NavbarContent justify="center">
          <NavbarItem>
            <Link
              className="text-foreground"
              href="/job-search"
              underline="hover"
            >
              Applications
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link
              className="text-foreground"
              href="/job-search/qa"
              underline="hover"
            >
              Q/A
            </Link>
          </NavbarItem>
        </NavbarContent>
      )}
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
