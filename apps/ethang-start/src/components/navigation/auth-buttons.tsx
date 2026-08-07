import { Button, Text } from "@astryxdesign/core";
import { useStore } from "@ethang/store/use-store";
import isNil from "lodash/isNil.js";

import { authStore, authStoreActions } from "../../store/auth-store.ts";

export const AuthButtons = () => {
  const user = useStore(authStore, (state) => {
    return state.user;
  });

  console.log(user);
  if (!isNil(user)) {
    return (
      <div className="flex items-center gap-4">
        <Text>
          Logged in as <Text weight="bold">{user.username}</Text>
        </Text>
        <Button
          label="Logout"
          variant="destructive"
          onClick={() => {
            authStoreActions.signOut();
          }}
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button as="a" href="/login" label="Login" variant="primary" />
    </div>
  );
};
