import type { PropsWithChildren } from "react";

import { Navigation } from "../navigation/navigation.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <div className="m-4">
      <Navigation />
      <main>{children}</main>
    </div>
  );
};
