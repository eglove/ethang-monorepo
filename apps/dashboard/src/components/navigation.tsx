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

export const Navigation = () => {
  return (
    <Navbar>
      <NavbarBrand className="font-bold">
        <Link className="text-foreground" href="/">
          Dashboard
        </Link>
      </NavbarBrand>
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
