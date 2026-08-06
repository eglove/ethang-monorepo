import type { PropsWithChildren } from "react";

import { Navigation } from "../navigation/navigation.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <div className="m-4 mx-auto max-w-7xl">
      <Navigation />
      <main className="mb-4">{children}</main>
    </div>
  );
};
