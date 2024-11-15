import type { PropsWithChildren } from "react";

import { Navigation } from "../navigation/navigation";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <>
      <Navigation />
      <main className="mx-auto my-4 max-w-screen-xl px-4">
        {children}
      </main>
    </>
  );
};
