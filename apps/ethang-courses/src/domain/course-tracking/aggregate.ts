import { Effect } from "effect";

import type { CourseTrackingCommand } from "./commands.ts";
import type { CourseTrackingEvent } from "./events.ts";

import { applyStatus, type CourseTrackingState } from "./state.ts";

export const decide = (
  command: CourseTrackingCommand,
  state: CourseTrackingState
) => {
  if ("" === state.userId) {
    return [
      {
        courseUrl: command.courseUrl,
        kind: "TrackingCreated" as const,
        userId: command.userId
      }
    ];
  }
  return [
    {
      from: state.status,
      kind: "StatusChanged" as const,
      to: applyStatus(state.status)
    }
  ];
};

export const apply = (
  state: CourseTrackingState,
  event: CourseTrackingEvent
) => {
  switch (event.kind) {
    case "StatusChanged": {
      return { ...state, status: event.to };
    }
    case "TrackingCreated": {
      return {
        courseUrl: event.courseUrl,
        status: "COMPLETE",
        userId: event.userId
      } satisfies CourseTrackingState;
    }
    default: {
      const _exhaustive: never = event;
      const error = new Error(`Unknown event: ${String(_exhaustive)}`);
      return Effect.runSync(Effect.die(error));
    }
  }
};
