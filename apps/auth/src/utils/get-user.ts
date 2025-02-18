import { userSchema } from "@ethang/schemas/src/auth/user.ts";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

export const getUser = async (email: string, environment: Env) => {
  const data = await environment.DB.prepare(
    "SELECT * FROM Users where email = ?",
  )
    .bind(email)
    .first();

  if (isNil(data)) {
    return null;
  }

  const user = userSchema.parse(data);

  if (isError(user)) {
    return null;
  }

  return user;
};
