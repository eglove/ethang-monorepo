import { useStore } from "@ethang/store/use-store";
import { Button, Input } from "@heroui/react";
import { useSubmit } from "@hyper-fetch/react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import isNil from "lodash/isNil.js";
import { useState } from "react";

import { signIn, signInStore } from "../../components/admin/sign-in-store.ts";

const RouteComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { submit, submitting } = useSubmit(signIn);
  const { isSignedIn } = useStore(signInStore, (state) => {
    return {
      isSignedIn: state.isSignedIn,
    };
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit({ payload: { email, password } })
      .then(async ({ data }) => {
        if (!isNil(data)) {
          signInStore.setSignedIn({
            token: data.sessionToken,
            userId: data.id,
          });
          await router.navigate({ to: "/" });
        }
      })
      .catch(globalThis.console.error);
  };

  return (
    <div>
      {isSignedIn && <p className="text-center">Signed In</p>}
      <form className="max-w-sm m-4 mx-auto grid gap-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          onValueChange={setEmail}
          type="email"
          value={email}
        />
        <Input
          label="Password"
          onValueChange={setPassword}
          type="password"
          value={password}
        />
        <Button color="primary" isLoading={submitting} type="submit">
          Sign In
        </Button>
      </form>
    </div>
  );
};

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});
