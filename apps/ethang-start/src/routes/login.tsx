import {
  Button,
  Card,
  Field,
  Heading,
  Text,
  TextInput,
  VStack
} from "@astryxdesign/core";
import { useStore } from "@ethang/store/use-store.ts";
import {
  createFileRoute,
  redirect,
  useNavigate,
  useSearch
} from "@tanstack/react-router";
import { Effect } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import trim from "lodash/trim.js";
import { type SyntheticEvent, useEffect, useState } from "react";

import { getAuthState } from "../models/auth.ts";
import { authStore, authStoreActions } from "../store/auth-store.ts";

const forms = {
  EMAIL_ADDRESS: "Email Address",
  ENTER_YOUR_EMAIL: "Enter your email",
  ENTER_YOUR_PASSWORD: "Enter your password",
  PASSWORD: "Password",
  SIGN_IN: "Sign In",
  SIGN_IN_TO_ACCOUNT: "Sign in to your account",
  SIGNING_IN: "Signing in..."
} as const;

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: isString(search["redirect"]) ? search["redirect"] : ""
    };
  },
  // loader
  loader: async ({ search }: { search: { redirect: string } }) => {
    const { isAuthenticated } = await getAuthState();
    if (isAuthenticated) {
      const target = isString(search.redirect) ? search.redirect : "/";
      return redirect({ to: target });
    }
    return {};
  }
});

function Login() {
  const { error, isPending, user } = useStore(authStore, (state) => {
    return {
      error: state.error,
      isPending: state.isPending,
      user: state.user
    };
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@ethang/validate-unknown
  const search = useSearch({ from: "/login" });

  useEffect(() => {
    if (!isNil(user)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      navigate({ to: search.redirect ?? "/" }).catch(Effect.logError);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  }, [user, navigate, search.redirect]);

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    const trimmedEmail = trim(email);
    const trimmedPassword = trim(password);
    if (isEmpty(trimmedEmail) || isEmpty(trimmedPassword)) {
      return;
    }
    authStoreActions
      .signIn(trimmedEmail, trimmedPassword)
      .catch(Effect.logError);
  };

  return (
    <VStack gap={4} align="center" justify="center">
      <Card padding={6} maxWidth={400} variant="muted">
        <form noValidate onSubmit={handleSubmit}>
          <VStack gap={3}>
            <Heading level={3} align="center">
              {forms.SIGN_IN_TO_ACCOUNT}
            </Heading>

            {!isNil(error) && (
              <Text size="sm" color="red" align="center">
                {error}
              </Text>
            )}

            <Field isRequired inputID="email" label={forms.EMAIL_ADDRESS}>
              <TextInput
                id="email"
                type="email"
                value={email}
                placeholder={forms.ENTER_YOUR_EMAIL}
                onChange={(value) => {
                  setEmail(value);
                }}
              />
            </Field>

            <Field isRequired inputID="password" label={forms.PASSWORD}>
              <TextInput
                id="password"
                type="password"
                value={password}
                placeholder={forms.ENTER_YOUR_PASSWORD}
                onChange={(value) => {
                  setPassword(value);
                }}
              />
            </Field>

            <Button
              size="lg"
              type="submit"
              variant="primary"
              isLoading={isPending}
              isDisabled={isPending}
              style={{ marginTop: "1rem", width: "100%" }}
              label={isPending ? forms.SIGNING_IN : forms.SIGN_IN}
            />
          </VStack>
        </form>
      </Card>
    </VStack>
  );
}
