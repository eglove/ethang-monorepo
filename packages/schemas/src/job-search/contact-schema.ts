/* eslint-disable lodash/prefer-lodash-method */
import { z } from "zod";

export const contactSchema = z.object({
  email: z.string().trim(),
  expectedNextContact: z.string().trim(),
  id: z.string().trim(),
  lastContact: z.string().trim(),
  linkedin: z.string().trim(),
  name: z.string().trim(),
  userEmail: z.string().trim(),
});

export type ContactSchema = z.infer<typeof contactSchema>;
