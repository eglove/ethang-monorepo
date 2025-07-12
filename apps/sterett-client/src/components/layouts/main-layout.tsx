import type { PropsWithChildren } from "react";

import { Navigation } from "../navigation/navigation.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <main>
      <Navigation />
      {children}
    </main>
  );
};
