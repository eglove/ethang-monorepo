import get from "lodash/get";

import { queryClient } from "@/components/common/providers.tsx";
import { userStore } from "@/components/stores/user-store.ts";
import { backupAllData } from "@/lib/sync-requests.ts";

export const signIn = async (value: { email: string; password: string }) => {
  const response = await globalThis.fetch("https://auth.ethang.dev/sign-in", {
    body: JSON.stringify(value),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to sign in.");
  }

  const data = await response.json();
  userStore.set((state) => {
    state.isSignedIn = true;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    state.token = get(data, ["token"], "") as unknown as string;
  });
  await backupAllData();
  await queryClient.invalidateQueries();

  return data;
};
