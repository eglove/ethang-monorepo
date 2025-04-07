import type { ReactNode } from "react";

export type CalendarEvent = {
  description?: ReactNode;
  end: Date;
  id: string;
  plainTextHtmlDescription?: string;
  start: Date;
  title: string;
};

export type CalendarView = "day" | "month" | "week" | "year";
