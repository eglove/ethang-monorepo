import type { CourseTrackingState } from "./state.ts";

export type CourseTrackingEvent =
  | {
      readonly courseUrl: string;
      readonly kind: "TrackingCreated";
      readonly userId: string;
    }
  | {
      readonly from: CourseTrackingState["status"];
      readonly kind: "StatusChanged";
      readonly to: CourseTrackingState["status"];
    };
