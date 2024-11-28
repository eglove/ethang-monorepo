import type { PropsWithChildren } from "react";

import { NavigationSidebar } from "@/components/navigation/navigation-sidebar.tsx";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { cn } from "@/lib/utils.ts";

type MainLayoutProperties = PropsWithChildren<{
  classNames?: {
    main?: string;
  };
}>;

export const MainLayout = ({
  children, classNames,
}: Readonly<MainLayoutProperties>) => {
  return (
    <SidebarProvider>
      <NavigationSidebar />
      <SidebarTrigger className="absolute left-0 top-0 md:hidden" />
      <main className={cn("mx-4 my-6", classNames?.main)}>
        {children}
      </main>
    </SidebarProvider>
  );
};
