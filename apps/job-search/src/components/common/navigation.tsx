import { SignInModal } from "@/components/common/sign-in-modal.tsx";
import { userStore, useUserStore } from "@/components/stores/user-store.ts";
import { logger } from "@/lib/logger.ts";
import { backupAllData } from "@/lib/sync-requests.ts";
import { useOnline } from "@ethang/hooks/use-online.js";
import {
  Button,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import map from "lodash/map.js";
import { CircleIcon } from "lucide-react";

const navLinks = [
  { label: "Applications", link: "/" },
  { label: "Q/A", link: "/qa" },
  { label: "Stats", link: "/stats" },
  { label: "Data Backup", link: "/data-backup" },
];

const handleSignOut = () => {
  userStore.set((state) => {
    state.isSignedIn = false;
    state.token = "";
  });
};

export const Navigation = () => {
  const store = useUserStore();
  const { isOnline } = useOnline({
    onOnline: () => {
      backupAllData()
        .then(() => {
          logger.info("Backup successful");
        })
        .catch(logger.error);
    },
  });

  return (
    <Navbar>
      <NavbarBrand>Job Track</NavbarBrand>
      <NavbarContent justify="center">
        {map(navLinks, (link) => {
          return (
            <NavbarItem key={link.label}>
              <Link
                className="text-foreground"
                href={link.link}
                underline="hover"
              >
                {link.label}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>
      <NavbarContent justify="end">
        {isOnline && (
          <div className="flex items-center text-success gap-1">
            <CircleIcon className="size-3 fill-success" /> Online
          </div>
        )}
        {!isOnline && (
          <div className="flex items-center text-danger gap-1">
            <CircleIcon className="size-3 fill-danger" /> Offline
          </div>
        )}
        {!store.isSignedIn && <SignInModal />}
        {store.isSignedIn && (
          <Button color="primary" onPress={handleSignOut} size="sm">
            Sign Out
          </Button>
        )}
      </NavbarContent>
    </Navbar>
  );
};
