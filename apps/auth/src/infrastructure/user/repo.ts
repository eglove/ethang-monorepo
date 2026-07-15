import { eq } from "drizzle-orm";
import { Effect } from "effect";
import isNil from "lodash/isNil.js";

import type { UserState } from "../../domain/user/state.ts";
import type { getDatabase } from "../../get-database.ts";

import { user as userTable } from "../../db/schema.ts";
import { FetchError } from "../../errors/fetch-error.ts";
import { SaveError } from "../../errors/save-error.ts";

const toState = (row: typeof userTable.$inferSelect) => {
  return {
    email: row.email,
    id: row.id,
    lastLoggedIn: row.lastLoggedIn,
    password: row.password,
    role: row.role,
    sessionToken: row.sessionToken,
    updatedAt: row.updatedAt,
    username: row.username
  };
};

export type UserRepo = {
  readonly fetch: (
    email: string
  ) => Effect.Effect<({ readonly id: string } & UserState) | null, FetchError>;
  readonly save: (
    state: UserState,
    version: null | string
  ) => Effect.Effect<{ readonly id: string } & UserState, SaveError>;
};

export const createUserRepo = (database: ReturnType<typeof getDatabase>) => {
  return {
    fetch: (email: string) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new FetchError(String(cause));
        },
        try: async () => {
          const row = await database.query.userTable.findFirst({
            where: eq(userTable.email, email)
          });

          return row ? toState(row) : null;
        }
      });
    },
    save: (state: UserState, version: null | string) => {
      return Effect.gen(function* () {
        if (isNil(version)) {
          const record = yield* Effect.tryPromise({
            catch: (cause) => {
              return new SaveError(String(cause));
            },
            try: async () => {
              const [row] = await database
                .insert(userTable)
                .values({
                  email: state.email,
                  lastLoggedIn: state.lastLoggedIn,
                  password: state.password ?? "",
                  role: state.role,
                  sessionToken: state.sessionToken,
                  username: state.username
                })
                .returning();
              return row ?? null;
            }
          });
          if (isNil(record)) {
            return yield* Effect.fail(new SaveError("Insert returned no rows"));
          }
          return toState(record);
        }

        yield* Effect.tryPromise({
          catch: (cause) => {
            return new SaveError(String(cause));
          },
          try: async () => {
            await database
              .update(userTable)
              .set({
                lastLoggedIn: state.lastLoggedIn,
                password: state.password ?? "",
                role: state.role,
                sessionToken: state.sessionToken
              })
              .where(eq(userTable.id, version))
              .run();
          }
        });

        return { ...state, id: version };
      });
    }
  };
};
