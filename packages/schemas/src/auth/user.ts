import isString from "lodash/isString.js";
import trim from "lodash/trim.js";
import { z } from "zod";

const trimKey = "trim";
const minKey = "min";

const passwordSchema = z
  .string()
  [minKey](8, "Password must be at least eight characters long")
  [trimKey]();

const emailSchema = z.preprocess((value) => {
  return isString(value) ? trim(value) : value;
}, z.email());

export const userSchema = z.object({
  createdAt: z.string()[trimKey](),
  email: emailSchema,
  lastLoggedIn: z.string()[trimKey]().nullable(),
  password: passwordSchema,
  role: z.string()[trimKey]().nullable(),
  updatedAt: z.string()[trimKey](),
  username: z.string()[trimKey]()
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: z.string()[trimKey]().optional()
});

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const verifySchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export type SignInSchema = z.infer<typeof signInSchema>;
export type SignUpSchema = z.infer<typeof signUpSchema>;
export type UserSchema = z.infer<typeof userSchema>;
export type VerifySchema = z.infer<typeof verifySchema>;
