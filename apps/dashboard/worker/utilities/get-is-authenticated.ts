import { createClerkClient } from "@clerk/backend";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import { jwtDecode } from "jwt-decode";
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

  const { isSignedIn, token } = await clerkClient.authenticateRequest(request);

  if (!isSignedIn || isNil(token)) {
    return false;
  }

  const decoded = jwtDecode(token);
  const userId = decoded.sub;

  if (isNil(userId)) {
    return false;
  }

  return userId;
};
