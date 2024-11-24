import type { PropsWithChildren } from "react";

import { NavigationSidebar } from "@/components/navigation/navigation-sidebar.tsx";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar.tsx";

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <NavigationSidebar />
      <SidebarTrigger className="ml-1" />
      <main className="m-4">
        {children}
      </main>
    </SidebarProvider>
  );
};
