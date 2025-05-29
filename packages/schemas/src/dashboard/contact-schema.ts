import { z } from "zod";

export const contactSchema = z.object({
  email: z.string().nullable(),
  expectedNextContact: z.string().nullable(),
  id: z.string(),
  lastContact: z.string(),
  linkedIn: z.string().nullable(),
  name: z.string(),
  phone: z.string().nullable(),
  userId: z.string(),
});

export const createContactSchema = contactSchema.omit({
  id: true,
  userId: true,
});

export const deleteContactSchema = z.object({
  id: z.string(),
});

export const contactsSchema = z.array(contactSchema);

export type Contact = z.infer<typeof contactSchema>;
export type CreateContact = z.infer<typeof createContactSchema>;
export type DeleteContact = z.infer<typeof deleteContactSchema>;
