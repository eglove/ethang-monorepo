/* eslint-disable lodash/prefer-lodash-method */
import { z } from "zod";

const passwordSchema = z.string().min(8, "Password must be at least eight characters long").trim();

export const userSchema = z.object({
  createdAt: z.string().trim(),
  email: z.email().trim(),
  lastLoggedIn: z.string().trim().nullable(),
  password: passwordSchema,
  role: z.string().trim().nullable(),
  updatedAt: z.string().trim(),
  username: z.string().trim(),
});

export const signUpSchema = z.object({
  email: z.email().trim(),
  password: passwordSchema,
  username: z.string().trim().optional(),
});

export const signInSchema = z.object({
  email: z.email().trim(),
  password: passwordSchema,
});

export type SignInSchema = z.infer<typeof signInSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export type UserSchema = z.infer<typeof userSchema>;
