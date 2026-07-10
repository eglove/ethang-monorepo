import { Data, DateTime, Effect } from "effect";
import isNil from "lodash/isNil.js";

export type User = {
  email: string;
  exp: number;
  iat: number;
  role?: string;
  sub: string;
  username: string;
};

export class UnauthorizedError extends Data.Error<{
  readonly message: string;
}> {
  public override name = "UnauthorizedError";
}

export const authenticate = (request: Request) => {
  const token = request.headers.get("X-Token");

  if (isNil(token)) {
    return Effect.fail(new UnauthorizedError({ message: "Unauthorized" }));
  }

  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      catch: () => {
        return new UnauthorizedError({ message: "Unauthorized" });
      },
      try: async () => {
        return fetch("https://auth.ethang.dev/verify", {
          headers: {
            "X-Token": token
          }
        });
      }
    });

    if (!response.ok) {
      yield* Effect.fail(new UnauthorizedError({ message: "Unauthorized" }));
    }

    const user = yield* Effect.tryPromise({
      catch: () => {
        return new UnauthorizedError({ message: "Unauthorized" });
      },
      try: async (): Promise<User> => {
        return response.json();
      }
    });

    const currentTime = Math.floor(
      DateTime.toEpochMillis(DateTime.unsafeNow()) / 1000
    );

    if (currentTime > user.exp) {
      yield* Effect.fail(new UnauthorizedError({ message: "Unauthorized" }));
    }

    return user;
  });
};
