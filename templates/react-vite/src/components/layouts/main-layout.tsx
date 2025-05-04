import type { PropsWithChildren } from "react";

import { GlobalProviders } from "../global-providers.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return <GlobalProviders>{children}</GlobalProviders>;
};
