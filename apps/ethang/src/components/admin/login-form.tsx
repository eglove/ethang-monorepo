import { useStore } from "@ethang/store/use-store";
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import isEmpty from "lodash/isEmpty";
import isString from "lodash/isString.js";

import { TypographyH1 } from "../typography/typography-h1.tsx";
import { loginStore } from "./login-store.ts";

export const LoginForm = () => {
  const state = useStore(loginStore, (_state) => {
    return {
      email: _state.email,
      isLoginLoading: _state.isLoginLoading,
      loginErrorMessage: _state.loginErrorMessage,
      password: _state.password,
    };
  });

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <TypographyH1>Admin Login</TypographyH1>
      </CardHeader>
      <CardBody>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            loginStore.handleSignIn(event);
          }}
        >
          <Input
            isRequired
            name="email"
            type="email"
            label="Email"
            value={state.email}
            onValueChange={(value) => {
              loginStore.setEmail(value);
            }}
          />
          <Input
            isRequired
            name="password"
            type="password"
            label="Password"
            value={state.password}
            onValueChange={(value) => {
              loginStore.setPassword(value);
            }}
          />
          {isString(state.loginErrorMessage) &&
            !isEmpty(state.loginErrorMessage) && (
              <p className="text-sm text-danger">{state.loginErrorMessage}</p>
            )}
          <Button
            type="submit"
            color="primary"
            isLoading={state.isLoginLoading}
          >
            Login
          </Button>
        </form>
      </CardBody>
    </Card>
  );
};
