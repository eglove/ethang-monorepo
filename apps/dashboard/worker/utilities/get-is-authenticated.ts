import { createClerkClient } from "@clerk/backend";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";
import isNil from "lodash/isNil";

export const getIsAuthenticated = async (
  request: Request,
  environment: Env,
) => {
  const isDevelopment = "development" === import.meta.env.MODE;
  const keys = isDevelopment
    ? ([environment.CLERK_PUBLIC_KEY, environment.CLERK_SECRET_KEY] as [
        string,
        string,
      ])
    : await attemptAsync(async () => {
        return Promise.all([
          environment.clerkPublishableKey.get(),
          environment.clerkSecretKey.get(),
        ]);
      });

  if (isError(keys)) {
    return false;
  }

  const [pk, sk] = keys;

  const clerkClient = createClerkClient({
    publishableKey: pk,
    secretKey: sk,
  });

  const { isAuthenticated, toAuth, token } =
    await clerkClient.authenticateRequest(request);

  if (!isAuthenticated || isNil(token)) {
    return false;
  }

  const auth = toAuth();

  if (isNil(auth.userId)) {
    return false;
  }

  return auth.userId;
};
