import { z } from "zod";

export const userSchema = z.object({
  createdAt: z.string(),
  email: z.string(),
  lastLoggedIn: z.string().nullable(),
  password: z.string(),
  role: z.string().nullable(),
  updatedAt: z.string(),
  username: z.string(),
});

export type UserSchema = z.infer<typeof userSchema>;
