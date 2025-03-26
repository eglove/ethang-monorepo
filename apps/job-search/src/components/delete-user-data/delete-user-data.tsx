import { userStore } from "@/components/stores/user-store.ts";
import { queryKeys } from "@/data/queries.ts";
import { syncUrls } from "@/data/urls.ts";
import {
  getDatabase,
  JOB_APPLICATION_STORE_NAME,
  QUESTION_ANSWER_STORE_NAME,
} from "@/database/indexed-database.ts";
import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { decodeJwt } from "jose";
import { XIcon } from "lucide-react";

export const DeleteUserData = () => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const store = userStore.get();
      const database = await getDatabase();

      const applicationTransaction = database.transaction(
        JOB_APPLICATION_STORE_NAME,
        "readwrite",
      );

      const qaTransaction = database.transaction(
        QUESTION_ANSWER_STORE_NAME,
        "readwrite",
      );

      await Promise.all([
        applicationTransaction.store.clear(),
        qaTransaction.store.clear(),
      ]);

      await Promise.all([applicationTransaction.done, qaTransaction.done]);

      const decoded = decodeJwt<{ email: string }>(userStore.get().token);

      await globalThis.fetch(syncUrls.userData, {
        body: JSON.stringify({ userEmail: decoded.email }),
        headers: {
          Authorization: store.token,
          "Content-Type": "application/json",
        },
        method: "DELETE",
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications(),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.qas(),
        }),
      ]);
    },
  });

  return (
    <div>
      <Button
        onPress={() => {
          deleteMutation.mutate();
        }}
        className="w-full"
        color="danger"
        disabled={deleteMutation.isPending}
        isLoading={deleteMutation.isPending}
        startContent={<XIcon className="size-5" />}
      >
        Delete All Data
      </Button>
    </div>
  );
};
