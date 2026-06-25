export type CourseTrackingState = {
  readonly courseUrl: string;
  readonly status: "COMPLETE" | "INCOMPLETE" | "REVISIT";
  readonly userId: string;
};

export const initialState: CourseTrackingState = {
  courseUrl: "",
  status: "COMPLETE",
  userId: ""
};

const STATUS_CYCLE: Record<
  CourseTrackingState["status"],
  CourseTrackingState["status"]
> = {
  COMPLETE: "REVISIT",
  INCOMPLETE: "COMPLETE",
  REVISIT: "INCOMPLETE"
};

export const applyStatus = (status: CourseTrackingState["status"]) => {
  return STATUS_CYCLE[status];
};
