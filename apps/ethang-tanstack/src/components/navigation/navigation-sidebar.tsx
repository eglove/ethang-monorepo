import { ModeToggle } from "@/components/mode-toggle.tsx";
import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { TypographyLink } from "@/components/typography/typography-link.tsx";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger,
} from "@/components/ui/sidebar.tsx";
import map from "lodash/map";
import { CpuIcon, FileUserIcon, HomeIcon, KanbanIcon, SchoolIcon, ShieldCheckIcon } from "lucide-react";

const links = [
  {
    href: "/",
    Icon: HomeIcon,
    label: "Blog",
  },
  {
    href: "/skills",
    Icon: CpuIcon,
    label: "Skills",
  },
  {
    href: "/resume",
    Icon: FileUserIcon,
    label: "Resume",
  },
  {
    href: "/certifications",
    Icon: ShieldCheckIcon,
    label: "Certifications",
  },
  {
    href: "/projects",
    Icon: KanbanIcon,
    label: "Projects",
  },
  {
    href: "/courses",
    Icon: SchoolIcon,
    label: "Courses",
  },
];

export const NavigationSidebar = () => {
  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarHeader />
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="flex flex-row flex-wrap items-center">
            <SidebarMenuItem>
              <SidebarTrigger className="ml-1 hidden md:block" />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <ModeToggle />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <TypographyH1>
              EthanG
            </TypographyH1>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="my-2">
              {map(links, (link) => {
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild>
                      <TypographyLink
                        className="text-foreground no-underline"
                        href={link.href}
                        title={link.label}
                      >
                        <link.Icon />
                        <span>
                          {link.label}
                        </span>
                      </TypographyLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};
