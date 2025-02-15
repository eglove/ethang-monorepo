import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import map from "lodash/map.js";

const navLinks = [
  { label: "Applications", link: "/" },
  { label: "Q/A", link: "/qa" },
  { label: "Stats", link: "/stats" },
  { label: "Data Backup", link: "/data-backup" },
];

export const Navigation = () => {
  return (
    <Navbar>
      <NavbarBrand>Job Track</NavbarBrand>
      <NavbarContent justify="center">
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
        <SignedOut>
          <SignInButton mode="modal" />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </NavbarContent>
    </Navbar>
  );
};
