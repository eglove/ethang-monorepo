import { SignInModal } from "@/components/common/sign-in-modal.tsx";
import { userStore, useUserStore } from "@/components/stores/user-store.ts";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { Card, CardBody, CardHeader, Switch } from "@heroui/react";
import isNil from "lodash/isNil";
import { ClockIcon } from "lucide-react";

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
        {!store.isSignedIn && (
          <>
            <TypographyP>Sign in to sync data to the cloud.</TypographyP>
            <SignInModal />
          </>
        )}
        {store.isSignedIn && (
          <>
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
                {isNil(store.lastSynced)
                  ? "Never"
                  : new Date(store.lastSynced).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
              </div>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
};
