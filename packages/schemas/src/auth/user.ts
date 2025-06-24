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

export const signUpSchema = z.object({
  email: z.string().trim(),
  password: z.string().trim(),
  username: z.string().trim(),
});

export const signInSchema = z.object({
  email: z.string().trim(),
  password: z.string().trim(),
});

export type SignInSchema = z.infer<typeof signInSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export type UserSchema = z.infer<typeof userSchema>;
