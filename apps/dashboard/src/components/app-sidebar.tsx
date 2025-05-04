import { Link } from "@tanstack/solid-router";
import { BriefcaseBusinessIcon, DumbbellIcon } from "lucide-solid";
import { For } from "solid-js";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar.tsx";

const items = [
  { icon: BriefcaseBusinessIcon, title: "Job Search", url: "/" },
  { icon: DumbbellIcon, title: "Workout", url: "/workout" },
];

export const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <For each={items}>
              {(item) => {
                return (
                  <SidebarMenuItem class="list-none">
                    <SidebarMenuButton as={Link} href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }}
            </For>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
