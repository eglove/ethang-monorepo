import type { PropsWithChildren } from "react";

import { twMerge } from "tailwind-merge";

import { Navigation } from "@/components/common/navigation.tsx";

type MainLayoutProperties = Readonly<
  PropsWithChildren<{
    classNames?: {
      container?: string;
      main?: string;
    };
  }>
>;

export const MainLayout = ({ children, classNames }: MainLayoutProperties) => {
  return (
    <main className={twMerge("p-4 pb-24 min-h-screen", classNames?.main)}>
      <div
        className={twMerge("max-w-screen-xl mx-auto", classNames?.container)}
      >
        <Navigation />
        {children}
      </div>
    </main>
  );
};
