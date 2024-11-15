import type { PropsWithChildren } from "react";

import { MotionRoute } from "../motion-route.tsx";
import { Navigation } from "../navigation/navigation.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <MotionRoute>
      <main>
        <Navigation />
        {children}
      </main>
    </MotionRoute>
  );
};
