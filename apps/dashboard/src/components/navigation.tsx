import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";

export const Navigation = () => {
  return (
    <Navbar>
      <NavbarBrand>Dashboard</NavbarBrand>
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
