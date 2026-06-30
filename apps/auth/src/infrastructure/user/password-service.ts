import bcrypt from "bcryptjs";
import { Effect } from "effect";

import { HashError } from "../../errors/hash-error.ts";

export const createPasswordService = () => {
  return {
    compare: (password: string, hash: string) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new HashError(String(cause));
        },
        try: async () => {
          return bcrypt.compare(password, hash);
        }
      });
    },
    hash: (password: string) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new HashError(String(cause));
        },
        try: async () => {
          const salt = await bcrypt.genSalt();
          return bcrypt.hash(password, salt);
        }
      });
    }
  };
};
