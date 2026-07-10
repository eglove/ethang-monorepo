export type CourseTrackingCommand = {
  readonly courseUrl: string;
  readonly kind: "CycleStatus";
  readonly userId: string;
};
