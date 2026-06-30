import { Effect } from "effect";

import type { CourseTrackingCommand } from "../../domain/course-tracking/commands.ts";
import type { CourseTrackingRepo } from "./repo.ts";

import { apply, decide } from "../../domain/course-tracking/aggregate.ts";
import {
  type CourseTrackingState,
  initialState
} from "../../domain/course-tracking/state.ts";

export const carryCourseTrackingCommand = (
  command: CourseTrackingCommand,
  repo: CourseTrackingRepo
) => {
  return Effect.gen(function* () {
    const existing: ({ readonly id: string } & CourseTrackingState) | null =
      yield* repo.fetch(command);
    const state = existing ?? initialState;

    const events = decide(command, state);
    let newState = state;
    for (const event of events) {
      newState = apply(newState, event);
    }

    return yield* repo.save(newState, existing?.id ?? null);
  });
};
