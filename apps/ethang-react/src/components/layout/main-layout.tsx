import type { PropsWithChildren } from "react";

import { navigation } from "@ethang/intl/en/navigation.ts";
import { useStore } from "@ethang/store/use-store";
import { Button, Flex, Text } from "@radix-ui/themes";
import map from "lodash/map";
import { NavigationMenu } from "radix-ui";

import { authStore } from "../auth/auth-store.ts";
import { InternalLink } from "../internal-link.tsx";

const links = [
  { href: "/", label: navigation.HOME },
  { href: "/blog", label: navigation.BLOG },
  { href: "/tips", label: navigation.TIPS },
  { href: "/courses", label: navigation.COURSES },
  { href: "/rss", label: navigation.RSS }
];

export const MainLayout = ({ children }: Readonly<PropsWithChildren>) => {
  const { user } = useStore(authStore, (state) => {
    return { user: state.user };
  });

  const handleLogout = () => {
    authStore.signOut();
  };

  return (
    <>
      <Flex
        align="center"
        justify="between"
        className="my-4 border-b border-slate-800 pb-4"
      >
        <NavigationMenu.Root>
          <NavigationMenu.List className="flex flex-wrap gap-4">
            {map(links, (link) => {
              return (
                <NavigationMenu.Link asChild key={link.label}>
                  <InternalLink href={link.href}>{link.label}</InternalLink>
                </NavigationMenu.Link>
              );
            })}
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <Flex gap="4" align="center">
          {null === user ? (
            <NavigationMenu.Root>
              <NavigationMenu.List>
                <NavigationMenu.Link asChild>
                  <InternalLink href="/login">{navigation.LOGIN}</InternalLink>
                </NavigationMenu.Link>
              </NavigationMenu.List>
            </NavigationMenu.Root>
          ) : (
            <>
              <Text size="2" className="font-medium text-slate-400">
                {navigation.LOGGED_IN_AS}{" "}
                <span className="font-bold text-white">{user.username}</span>
              </Text>
              <Button
                size="2"
                color="red"
                variant="soft"
                onClick={handleLogout}
                className="cursor-pointer font-semibold"
              >
                {navigation.LOGOUT}
              </Button>
            </>
          )}
        </Flex>
      </Flex>
      {children}
    </>
  );
};
