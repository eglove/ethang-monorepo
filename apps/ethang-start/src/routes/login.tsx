import {
  Button,
  Card,
  Field,
  Heading,
  Text,
  TextInput,
  VStack
} from "@astryxdesign/core";
import {
  createFileRoute,
  useNavigate,
  useSearch
} from "@tanstack/react-router";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";
import noop from "lodash/noop.js";
import trim from "lodash/trim.js";
import { type FormEvent, useEffect, useState } from "react";

import { getSessionToken } from "../utils/auth.ts";

const forms = {
  EMAIL_ADDRESS: "Email Address",
  ENTER_YOUR_EMAIL: "Enter your email",
  ENTER_YOUR_PASSWORD: "Enter your password",
  PASSWORD: "Password",
  SIGN_IN: "Sign In",
  SIGN_IN_TO_ACCOUNT: "Sign in to your account",
  SIGNING_IN: "Signing in..."
} as const;

const SIGN_IN_ENDPOINT = "https://auth.ethang.dev/sign-in";

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: isString(search["redirect"]) ? search["redirect"] : ""
    };
  },
  // loader
  loader: async ({ request, search }) => {
    const cookieHeader = request.headers.get("Cookie") ?? "";
    const token = getSessionToken(cookieHeader);
    if (token) {
      return { redirect: isString(search.redirect) ? search.redirect : "/" };
    }
    return {};
  }
});

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const search = useSearch({ from: Route.id });

  useEffect(() => {
    if (!isNil(search.redirect)) {
      navigate({ to: search.redirect }).catch(noop);
    }
  }, [navigate, search.redirect]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = trim(email);
    const trimmedPassword = trim(password);
    if (!trimmedEmail.length || !trimmedPassword.length) {
      return;
    }
    setIsPending(true);
    setError(null);

    try {
      await fetch(SIGN_IN_ENDPOINT, {
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      navigate({ to: search.redirect ?? "/" }).catch(noop);
    } catch (error_) {
      setError(Error.isError(error_) ? error_.message : "Failed to sign in");
      setIsPending(false);
    }
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
