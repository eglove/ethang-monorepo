import type { PropsWithChildren } from "react";

import { SignedIn } from "@clerk/clerk-react";

import { Navigation } from "../navigation.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <>
      <Navigation />
      <SignedIn>
        <main className="max-w-5xl mx-auto">{children}</main>
      </SignedIn>
    </>
  );
};
