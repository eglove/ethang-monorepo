import type { PropsWithChildren } from "react";

import { NavigationSidebar } from "@/components/navigation/navigation-sidebar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@ethang/react-components/src/components/ui/sidebar.tsx";
import { Toaster } from "@ethang/react-components/src/components/ui/sonner.tsx";

type MainLayoutProperties = PropsWithChildren<{
  classNames?: {
    main?: string;
  };
}>;

export const MainLayout = ({
  children,
  classNames,
}: Readonly<MainLayoutProperties>) => {
  return (
    <SidebarProvider>
      <NavigationSidebar />
      <SidebarTrigger className="absolute left-0 top-0 md:hidden" />
      <main className={cn("mx-4 my-6 pb-12", classNames?.main)}>
        {children}
      </main>
      <Toaster />
    </SidebarProvider>
  );
};
