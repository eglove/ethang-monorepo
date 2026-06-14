import type { JWTVerifyResult } from "jose";

import { z } from "zod";

const trimKey = "trim";

export const tokenSchema = z.object({
  email: z.string()[trimKey](),
  role: z.string()[trimKey](),
  sub: z.string()[trimKey](),
  username: z.string()[trimKey]()
});

export const signInResponseToken = z.object({
  email: z.string(),
  id: z.string(),
  lastLoggedIn: z.string(),
  role: z.string(),
  sessionToken: z.string(),
  updatedAt: z.string(),
  username: z.string()
});

export type TokenSchema = z.infer<typeof tokenSchema>;
export type VerifiedTokenSchema = JWTVerifyResult<TokenSchema>;
