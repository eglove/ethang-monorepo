import {
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { ModeToggle } from "@ethang/react-components/src/components/theme/mode-toggle.tsx";
import { TypographyH1 } from "@ethang/react-components/src/components/typography/typography-h1.tsx";
import { TypographyLink } from "@ethang/react-components/src/components/typography/typography-link.tsx";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@ethang/react-components/src/components/ui/sidebar.tsx";
import { Authenticated, Unauthenticated } from "convex/react";
import map from "lodash/map";
import { CpuIcon, FileUser, HomeIcon, KanbanIcon, SchoolIcon, ShieldCheckIcon } from "lucide-react";

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
    Icon: FileUser,
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
    <Sidebar collapsible="icon">
      <SidebarHeader />
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu className="flex flex-row flex-wrap items-center gap-2">
            <SidebarMenuItem>
              <SidebarTrigger className="size-8" />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <ModeToggle />
            </SidebarMenuItem>
            <SidebarMenuItem className="grid place-items-center">
              <Unauthenticated>
                <SignInButton />
              </Unauthenticated>
              <Authenticated>
                <UserButton />
              </Authenticated>
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
              {
                map(links, (link) => {
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
                })
              }
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};
