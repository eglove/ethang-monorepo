import type { PropsWithChildren } from "react";

import { NavigationSidebar } from "@/components/navigation/navigation-sidebar.tsx";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <SidebarProvider>
      <NavigationSidebar />
      <SidebarTrigger className="absolute left-0 top-0 md:hidden" />
      <main className="mx-4 my-6">
        {children}
      </main>
    </SidebarProvider>
  );
};
