import type { PropsWithChildren } from "react";

import { HeroUIProvider } from "@heroui/react";

export const Providers = ({ children }: Readonly<PropsWithChildren>) => {
  return <HeroUIProvider>{children}</HeroUIProvider>;
};
