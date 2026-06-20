import { forms } from "@ethang/intl/en/forms.ts";
import { useStore } from "@ethang/store/use-store";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Text,
  TextField
} from "@radix-ui/themes";
import {
  createFileRoute,
  useNavigate,
  useSearch
} from "@tanstack/react-router";
import isNil from "lodash/isNil";
import isString from "lodash/isString.js";
import noop from "lodash/noop.js";
import trim from "lodash/trim.js";
import { type SyntheticEvent, useEffect, useState } from "react";

import { authStore } from "../components/auth/auth-store.ts";
import { MainLayout } from "../components/layout/main-layout.tsx";

const Login = () => {
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const search = useSearch({ from: "/login" });

  useEffect(() => {
    if (!isNil(user)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      navigate({ to: search.redirect ?? "/" }).catch(noop);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  }, [user, navigate, search.redirect]);

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    const hasEmail = 0 < trim(email).length;
    const hasPassword = 0 < trim(password).length;
    if (hasEmail && hasPassword) {
      authStore.signIn(email, password).catch(noop);
    }
  };

  return (
    <MainLayout>
      <Flex align="center" justify="center" className="min-h-[60vh] p-4">
        <Card className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-900/40 p-8 shadow-2xl backdrop-blur-lg transition-all duration-300 hover:border-blue-500/50">
          <form noValidate onSubmit={handleSubmit}>
            <Flex gap="4" direction="column">
              <Heading
                size="6"
                align="center"
                className="mb-2 tracking-tight text-white"
              >
                {forms.SIGN_IN_TO_ACCOUNT}
              </Heading>

              {null !== error && (
                <Box className="animate-in fade-in zoom-in-95 rounded-xl border border-red-800/60 bg-red-950/40 p-3 transition-all duration-300">
                  <Text
                    size="2"
                    color="red"
                    align="center"
                    className="font-medium"
                  >
                    {error}
                  </Text>
                </Box>
              )}

              <Flex gap="1" direction="column">
                <Text size="2" weight="bold" className="text-slate-300">
                  {forms.EMAIL_ADDRESS}
                </Text>
                <TextField.Root
                  required
                  type="email"
                  value={email}
                  placeholder={forms.ENTER_YOUR_EMAIL}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-white transition-colors focus:border-blue-500"
                />
              </Flex>

              <Flex gap="1" direction="column">
                <Text size="2" weight="bold" className="text-slate-300">
                  {forms.PASSWORD}
                </Text>
                <TextField.Root
                  required
                  type="password"
                  value={password}
                  placeholder={forms.ENTER_YOUR_PASSWORD}
                  onChange={(event) => {
                    setPassword(event.target.value);
                  }}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-white transition-colors focus:border-blue-500"
                />
              </Flex>

              <Button
                size="3"
                type="submit"
                disabled={isPending}
                className="mt-4 cursor-pointer bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 font-semibold shadow-lg shadow-blue-500/20 transition-all duration-300 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? forms.SIGNING_IN : forms.SIGN_IN}
              </Button>
            </Flex>
          </form>
        </Card>
      </Flex>
    </MainLayout>
  );
};

type LoginSearch = {
  redirect?: string;
};

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (search: Record<string, unknown>): LoginSearch => {
    return {
      redirect: isString(search["redirect"]) ? search["redirect"] : ""
    };
  }
});
