import { useUserStore } from "@/components/stores/user-store.ts";
import { getAllData } from "@/lib/sync-requests.ts";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty";
import { CloudIcon } from "lucide-react";
import { useState } from "react";

export const RemoteImportApplications = () => {
  const [importErrorMessage, setImportErrorMessage] = useState("");
  const userStore = useUserStore();

  const remoteImport = useMutation({
    mutationFn: async () => {
      await getAllData();
      setImportErrorMessage("");
    },
    onError: (error) => {
      setImportErrorMessage(error.message);
    },
  });

  if (!userStore.isSignedIn) {
    return (
      <Button isDisabled startContent={<CloudIcon className="size-5" />}>
        Sign In to import cloud data
      </Button>
    );
  }

  return (
    <>
      <Button
        onPress={() => {
          remoteImport.mutate();
        }}
        color="secondary"
        disabled={remoteImport.isPending}
        isLoading={remoteImport.isPending}
        startContent={<CloudIcon className="size-5" />}
      >
        Cloud Import
      </Button>
      {!isEmpty(importErrorMessage) && (
        <div className="text-danger mt-1">{importErrorMessage}</div>
      )}
    </>
  );
};
