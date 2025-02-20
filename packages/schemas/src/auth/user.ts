/* eslint-disable lodash/prefer-lodash-method */
import { z } from "zod";

export const userSchema = z.object({
  createdAt: z.string().trim(),
  email: z.string().trim(),
  lastLoggedIn: z.string().trim().nullable(),
  password: z.string().trim(),
  role: z.string().trim().nullable(),
  updatedAt: z.string().trim(),
  username: z.string().trim(),
});

export type UserSchema = z.infer<typeof userSchema>;
