import { setIsUserSyncing, userStore } from "@/components/stores/user-store.ts";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Switch,
} from "@heroui/react";
import { useStore } from "@tanstack/react-store";
import { ClockIcon, CloudIcon } from "lucide-react";
import { DateTime } from "luxon";

export const DataSync = () => {
  const store = useStore(userStore);

  return (
    <Card>
      <CardHeader>
        <TypographyH3>Sync Control</TypographyH3>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <SignedOut>
          <TypographyP>Sign in to sync data to the cloud.</TypographyP>
          <Button as="div" color="primary" size="sm">
            <SignInButton mode="modal" />
          </Button>
        </SignedOut>
        <SignedIn>
          <div className="flex gap-2 justify-between">
            <div>Sync Status:</div>
            <Chip startContent={<CloudIcon />}>Syncing in progress...</Chip>
          </div>
          <div className="flex gap-2 justify-between">
            <div>Enable Data Sync</div>
            <Switch
              aria-label={`Data ${store.isSyncing ? "Syncing" : "Not Syncing"}`}
              color="success"
              isSelected={store.isSyncing}
              onValueChange={setIsUserSyncing}
            />
          </div>
          <div className="flex gap-2 justify-between">
            <div>Last Synced:</div>
            <div className="flex items-center gap-1">
              <ClockIcon className="size-4" />
              {DateTime.now().toLocaleString({
                dateStyle: "short",
                timeStyle: "medium",
              })}
            </div>
          </div>
        </SignedIn>
      </CardBody>
    </Card>
  );
};
