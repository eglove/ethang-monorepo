/* eslint-disable lodash/prefer-lodash-method */
import type { JWTVerifyResult } from "jose";

import { z } from "zod";

export const tokenSchema = z.object({
  email: z.string().trim(),
  role: z.string().trim(),
  sub: z.string().trim(),
  username: z.string().trim(),
});

export const tokenResponseSchema = z.object({
  token: z.string().trim(),
  userId: z.string().trim(),
});

export type TokenSchema = z.infer<typeof tokenSchema>;
export type VerifiedTokenSchema = JWTVerifyResult<TokenSchema>;
