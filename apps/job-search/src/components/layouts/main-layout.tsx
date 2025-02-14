import type { PropsWithChildren } from "react";

import { Navigation } from "@/components/common/navigation.tsx";

type MainLayoutProperties = PropsWithChildren;

export const MainLayout = ({ children }: MainLayoutProperties) => {
  return (
    <main className="m-4 mb-24">
      <Navigation />
      {children}
    </main>
  );
};
