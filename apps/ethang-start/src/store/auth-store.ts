import { makeStore, type Store } from "@ethang/store/store.ts";
import isNil from "lodash/isNil.js";

import { signIn, type User } from "../models/auth.ts";

export type AuthState = {
  error: null | string;
  isPending: boolean;
  user: null | User;
};

const initialState: AuthState = { error: null, isPending: false, user: null };

const signInAction = async (
  store: Store<AuthState>,
  email: string,
  password: string
) => {
  store.update((draft) => {
    draft.error = null;
    draft.isPending = true;
  });

  // eslint-disable-next-line @ethang/validate-unknown
  const outcome = await signIn({ data: { email, password } });

  if (!isNil(outcome.failure)) {
    store.update((draft) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      draft.error = outcome.failure?.message ?? "Failed to sign in";
      draft.isPending = false;
    });
    return;
  }

  store.update((draft) => {
    draft.error = null;
    draft.isPending = false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    draft.user = outcome.success;
  });
};

export const authStore: Store<AuthState> = makeStore(initialState);

export const authStoreActions = {
  signIn: async (email: string, password: string) => {
    return signInAction(authStore, email, password);
  }
};
