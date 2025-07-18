import type { PropsWithChildren } from "react";

import { useStore } from "@ethang/store/use-store";
import { twMerge } from "tailwind-merge";

import { authStore } from "../../stores/auth-store.ts";
import { Footer, type FooterProperties } from "../footer.tsx";
import { Navigation } from "../navigation.tsx";

type MainLayoutProperties = PropsWithChildren<
  { classNames?: { main?: string } } & FooterProperties
>;

export const MainLayout = ({
  breadcrumbPaths,
  children,
  classNames,
}: Readonly<MainLayoutProperties>) => {
  const isSignedIn = useStore(authStore, (state) => state.isSignedIn);

  return (
    <div className="grid h-[100vb] grid-rows-[auto_1fr_auto]">
      <Navigation />
      <main
        className={twMerge(
          "px-4 max-w-5xl mx-auto w-full overflow-auto",
          classNames?.main,
        )}
      >
        {isSignedIn && children}
        {!isSignedIn && (
          <h1 className="text-3xl font-bold text-center">
            Sign In to Get Started
          </h1>
        )}
      </main>
      <Footer breadcrumbPaths={breadcrumbPaths} />
    </div>
  );
};
