/* eslint-disable lodash/prefer-lodash-method */
import type { JWTVerifyResult } from "jose";

import { z } from "zod";

export const tokenSchema = z.object({
  email: z.string().trim(),
  role: z.string().trim(),
  sub: z.string().trim(),
  username: z.string().trim(),
});

export const signInResponseToken = z.object({
  email: z.string(),
  id: z.string(),
  lastLoggedIn: z.string(),
  role: z.string(),
  sessionToken: z.string(),
  updatedAt: z.string(),
  username: z.string(),
});

export type TokenSchema = z.infer<typeof tokenSchema>;
export type VerifiedTokenSchema = JWTVerifyResult<TokenSchema>;
