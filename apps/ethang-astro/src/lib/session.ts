import { Effect, Schema } from "effect";
import isNil from "lodash/isNil.js";

const UserSchema = Schema.Struct({
  email: Schema.String,
  sessionToken: Schema.String,
  username: Schema.String
});

const SessionJsonSchema = Schema.parseJson(UserSchema);

export type SessionUser = {
  email: string;
  sessionToken: string;
  username: string;
};

/**
Decode the JSON-encoded session cookie produced by the sign-in action.
Returns `null` for any missing, malformed, or structurally invalid value so
callers can treat absence of a session uniformly.
*/
export const decodeSessionCookie = (value: null | string | undefined) => {
  if (isNil(value)) {
    return null;
  }

  return Effect.runSync(
    Effect.match(
      Effect.try({
        catch: () => {
          return null;
        },
        try: () => {
          return Schema.decodeUnknownSync(SessionJsonSchema)(value);
        }
      }),
      {
        onFailure: (error) => {
          return error;
        },
        onSuccess: (user) => {
          return user;
        }
      }
    )
  );
};
