import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { verifyToken } from "./jwt.ts";

export const getIsAdmin = async (request: Request, environment: Env) => {
  const authToken = request.headers.get("Authorization");

  if (isNil(authToken)) {
    return false;
  }

  const verification = await verifyToken(authToken, environment);

  if (isError(verification)) {
    return false;
  }

  return "admin" === verification.role;
};

export const getIsUser = async (
  request: Request,
  environment: Env,
  email: string,
) => {
  const authToken = request.headers.get("Authorization");

  if (isNil(authToken)) {
    return false;
  }

  const verification = await verifyToken(authToken, environment);

  if (isError(verification)) {
    return false;
  }

  return verification.email === email;
};
