import type { UserSchema } from "@ethang/schemas/auth/user.js";

export const getUser = async (email: string, environment: Env) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  return environment.DB.prepare("SELECT * FROM Users where email = ?")
    .bind(email)
    .first() as Promise<UserSchema>;
};
