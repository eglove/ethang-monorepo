export type CourseTrackingState = {
    readonly courseUrl: string;
    readonly status: "COMPLETE" | "INCOMPLETE" | "REVISIT";
    readonly userId: string;
};
export declare const initialState: CourseTrackingState;
export declare const applyStatus: (status: CourseTrackingState["status"]) => "COMPLETE" | "INCOMPLETE" | "REVISIT";
