import type { ParentProps } from "solid-js";

import { AppSidebar } from "~/components/app-sidebar.tsx";
import { ThemeToggle } from "~/components/theme-toggle.tsx";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar.tsx";

export const MainLayout = (properties: ParentProps) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main class="w-full mx-2">
        <div class="flex justify-between items-center border-b-2">
          <SidebarTrigger />
          <ThemeToggle />
        </div>
        <div class="my-2">{properties.children}</div>
      </main>
    </SidebarProvider>
  );
};
