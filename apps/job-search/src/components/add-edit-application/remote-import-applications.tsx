import { getCallData } from "@/lib/sync-requests.ts";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty";
import { CloudIcon } from "lucide-react";
import { useState } from "react";

export const RemoteImportApplications = () => {
  const [importErrorMessage, setImportErrorMessage] = useState("");

  const remoteImport = useMutation({
    mutationFn: async () => {
      await getCallData();
      setImportErrorMessage("");
    },
    onError: (error) => {
      setImportErrorMessage(error.message);
    },
  });

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
