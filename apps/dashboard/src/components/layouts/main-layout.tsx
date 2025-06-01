import type { PropsWithChildren } from "react";

import { SignedIn, SignedOut } from "@clerk/clerk-react";

import { Footer, type FooterProperties } from "../footer.tsx";
import { Navigation } from "../navigation.tsx";

type MainLayoutProperties = PropsWithChildren<FooterProperties>;

export const MainLayout = ({
  breadcrumbPaths,
  children,
}: Readonly<MainLayoutProperties>) => {
  return (
    <div className="MainLayout">
      <div className="Header">
        <Navigation />
      </div>
      <div className="Main">
        <main className="px-4 max-w-5xl mx-auto w-full">
          <SignedIn>{children}</SignedIn>
          <SignedOut>
            <h1 className="text-3xl font-bold text-center">
              Sign In to Get Started
            </h1>
          </SignedOut>
        </main>
      </div>
      <div className="Footer">
        <Footer breadcrumbPaths={breadcrumbPaths} />
      </div>
    </div>
  );
};
