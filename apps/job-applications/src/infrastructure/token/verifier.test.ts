import { Effect } from "effect";
import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";

import { TokenVerifier } from "../../application/ports/token-verifier.ts";
import { TokenError } from "../../errors/token-error.ts";
import { createTokenVerifierLayer } from "./verifier.ts";

const EMAIL = "me@example.com";
const SECRET = "shared-test-secret";
const layer = createTokenVerifierLayer(SECRET);

const sign = async (
  payload: Record<string, string>,
  secret = SECRET,
  expiresIn = "1yr",
) => {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  const jwt = new SignJWT(payload);
  jwt.setProtectedHeader({ alg: "HS256" });
  jwt.setIssuedAt();
  jwt.setExpirationTime(expiresIn);
  return jwt.sign(secretKey);
};

const run = async <A, E>(effect: Effect.Effect<A, E, TokenVerifier>) => {
  return Effect.runPromise(Effect.provide(effect, layer));
};

describe("token verifier", () => {
  it("returns the email claim from a valid token", async () => {
    const token = await sign({ email: EMAIL });
    const result = await run(
      Effect.gen(function* () {
        const verifier = yield* TokenVerifier;
        return yield* verifier.verify(token);
      }),
    );
    expect(result).toBe(EMAIL);
  });

  it("fails TokenError for a token signed with the wrong secret", async () => {
    const token = await sign({ email: EMAIL }, "wrong-secret");
    const result = await run(
      Effect.flip(
        Effect.gen(function* () {
          const verifier = yield* TokenVerifier;
          return yield* verifier.verify(token);
        }),
      ),
    );
    expect(result).toBeInstanceOf(TokenError);
  });

  it("fails TokenError for an expired token", async () => {
    const token = await sign({ email: EMAIL }, SECRET, "-1s");
    const result = await run(
      Effect.flip(
        Effect.gen(function* () {
          const verifier = yield* TokenVerifier;
          return yield* verifier.verify(token);
        }),
      ),
    );
    expect(result).toBeInstanceOf(TokenError);
  });

  it("fails TokenError for garbage input", async () => {
    const result = await run(
      Effect.flip(
        Effect.gen(function* () {
          const verifier = yield* TokenVerifier;
          return yield* verifier.verify("not-a-jwt");
        }),
      ),
    );
    expect(result).toBeInstanceOf(TokenError);
  });

  it("fails TokenError when the email claim is missing", async () => {
    const token = await sign({ username: "e" });
    const result = await run(
      Effect.flip(
        Effect.gen(function* () {
          const verifier = yield* TokenVerifier;
          return yield* verifier.verify(token);
        }),
      ),
    );
    expect(result).toBeInstanceOf(TokenError);
  });
});
