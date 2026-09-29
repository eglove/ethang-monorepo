import type { CourseTrackingCommand } from "./commands.ts";
import type { CourseTrackingEvent } from "./events.ts";
import { type CourseTrackingState } from "./state.ts";
export declare const decide: (command: CourseTrackingCommand, state: CourseTrackingState) => {
    courseUrl: string;
    kind: "TrackingCreated";
    userId: string;
}[] | {
    from: "COMPLETE" | "INCOMPLETE" | "REVISIT";
    kind: "StatusChanged";
    to: "COMPLETE" | "INCOMPLETE" | "REVISIT";
}[];
export declare const apply: (state: CourseTrackingState, event: CourseTrackingEvent) => {
    status: "COMPLETE" | "INCOMPLETE" | "REVISIT";
    courseUrl: string;
    userId: string;
};
