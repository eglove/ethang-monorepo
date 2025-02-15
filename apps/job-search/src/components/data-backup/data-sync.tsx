import { userStore, useUserStore } from "@/components/stores/user-store.ts";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Switch,
} from "@heroui/react";
import { ClockIcon, CloudIcon } from "lucide-react";
import { DateTime } from "luxon";

const handleSetIsSyncing = (value: boolean) => {
  userStore.set((state) => {
    state.isSyncing = value;
  });
};

export const DataSync = () => {
  const store = useUserStore();

  return (
    <Card>
      <CardHeader>
        <TypographyH3>Sync Control</TypographyH3>
      </CardHeader>
      <CardBody className="flex flex-col gap-4">
        <TypographyP>Sign in to sync data to the cloud.</TypographyP>
        {!store.isSignedIn && (
          <Button color="primary" size="sm">
            Sign In
          </Button>
        )}
        {store.isSignedIn && (
          <>
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
                onValueChange={handleSetIsSyncing}
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
          </>
        )}
      </CardBody>
    </Card>
  );
};
