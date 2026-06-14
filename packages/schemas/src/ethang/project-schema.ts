import { z } from "zod";

const techSchema = z.object({
  id: z.string(),
  name: z.string()
});

export const projectSchema = z.object({
  code: z.string(),
  description: z.string(),
  id: z.string(),
  publicUrl: z.string().optional().nullable(),
  techs: z.array(techSchema),
  title: z.string()
});

export type Project = z.output<typeof projectSchema>;
