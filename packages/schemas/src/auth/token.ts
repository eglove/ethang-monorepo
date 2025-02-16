import type { JWTVerifyResult } from "jose";

import { z } from "zod";

export const tokenSchema = z.object({
  email: z.string(),
  role: z.string(),
  username: z.string(),
});

export type TokenSchema = z.infer<typeof tokenSchema>;
export type VerifiedTokenSchema = JWTVerifyResult<TokenSchema>;
