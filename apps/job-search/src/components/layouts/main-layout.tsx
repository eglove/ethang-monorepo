import type { PropsWithChildren } from "react";

import { Navigation } from "@/components/common/navigation.tsx";

type MainLayoutProperties = Readonly<PropsWithChildren>;

export const MainLayout = ({ children }: MainLayoutProperties) => {
  return (
    <main className="dark text-foreground bg-background p-4 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Navigation />
        {children}
      </div>
    </main>
  );
};
