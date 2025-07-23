import { useStore } from "@ethang/store/use-store";
import { Button, Input } from "@heroui/react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { signInStore } from "../../components/admin/sign-in-store.ts";

const RouteComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { isSignedIn } = useStore(signInStore, (state) => {
    return {
      isSignedIn: state.isSignedIn,
    };
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    signInStore
      .signIn(email, password)
      .then(async () => {
        await router.navigate({ to: "/" });
      })
      .catch(globalThis.console.error);
  };

  return (
    <div>
      {isSignedIn && <p className="text-center">Signed In</p>}
      <form className="m-4 mx-auto grid max-w-sm gap-4" onSubmit={handleSubmit}>
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
        <Button color="primary" type="submit">
          Sign In
        </Button>
      </form>
    </div>
  );
};

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});
