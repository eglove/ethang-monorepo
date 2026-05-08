import { z } from "zod";

export const courseStatusSchema = z.object({
  courseUrl: z.string(),
  id: z.string(),
  status: z.enum(["Complete", "Incomplete", "Revisit"]),
  userId: z.string()
});

export const userTokenSchema = z.object({
  email: z.string(),
  exp: z.number(),
  iat: z.number(),
  role: z.string().optional(),
  sub: z.string(),
  username: z.string()
});

export type CourseCompletionState = {
  courses: Record<string, CourseState>;
  isAuthenticated: boolean;
  userId: null | string;
};

export type CourseState = {
  isLoading: boolean;
  status: CourseStatusValue;
};

export type CourseStatusValue = z.infer<typeof courseStatusSchema>["status"];
