import { describe, expect, it } from "vitest";

import type { CourseTrackingCommand } from "./commands.ts";
import type { CourseTrackingEvent } from "./events.ts";

import { apply, decide } from "./aggregate.ts";
import {
  applyStatus,
  type CourseTrackingState,
  initialState
} from "./state.ts";

const ERROR_NO_EVENT = "Expected an event";
const COURSE_URL = "https://example.com/course-1";

const COMMAND: CourseTrackingCommand = {
  courseUrl: COURSE_URL,
  kind: "CycleStatus",
  userId: "user-1"
};

const EXISTING_STATE: CourseTrackingState = {
  courseUrl: COURSE_URL,
  status: "COMPLETE",
  userId: "user-1"
};

describe("decide", () => {
  it("emits TrackingCreated when state is empty (new tracking)", () => {
    const events = decide(COMMAND, initialState);
    expect(events).toStrictEqual([
      { courseUrl: COURSE_URL, kind: "TrackingCreated", userId: "user-1" }
    ]);
  });

  it("emits StatusChanged COMPLETE -> REVISIT", () => {
    const state: CourseTrackingState = {
      ...EXISTING_STATE,
      status: "COMPLETE"
    };
    const events = decide(COMMAND, state);
    expect(events).toStrictEqual([
      { from: "COMPLETE", kind: "StatusChanged", to: "REVISIT" }
    ]);
  });

  it("emits StatusChanged REVISIT -> INCOMPLETE", () => {
    const state: CourseTrackingState = { ...EXISTING_STATE, status: "REVISIT" };
    const events = decide(COMMAND, state);
    expect(events).toStrictEqual([
      { from: "REVISIT", kind: "StatusChanged", to: "INCOMPLETE" }
    ]);
  });

  it("emits StatusChanged INCOMPLETE -> COMPLETE", () => {
    const state: CourseTrackingState = {
      ...EXISTING_STATE,
      status: "INCOMPLETE"
    };
    const events = decide(COMMAND, state);
    expect(events).toStrictEqual([
      { from: "INCOMPLETE", kind: "StatusChanged", to: "COMPLETE" }
    ]);
  });
});

describe("apply", () => {
  it("applies TrackingCreated to produce initial tracking state", () => {
    const event: CourseTrackingEvent = {
      courseUrl: "https://example.com/c",
      kind: "TrackingCreated",
      userId: "user-1"
    };
    const newState = apply(initialState, event);
    expect(newState).toStrictEqual({
      courseUrl: "https://example.com/c",
      status: "COMPLETE",
      userId: "user-1"
    });
  });

  it("applies StatusChanged to update status", () => {
    const state: CourseTrackingState = {
      ...EXISTING_STATE,
      status: "COMPLETE"
    };
    const event: CourseTrackingEvent = {
      from: "COMPLETE",
      kind: "StatusChanged",
      to: "REVISIT"
    };
    const newState = apply(state, event);
    expect(newState).toStrictEqual({
      ...EXISTING_STATE,
      status: "REVISIT"
    });
  });

  it("applies TrackingCreated on non-initial state (edge case)", () => {
    const state: CourseTrackingState = { ...EXISTING_STATE, status: "REVISIT" };
    const event: CourseTrackingEvent = {
      courseUrl: "new-url",
      kind: "TrackingCreated",
      userId: "new-user"
    };
    const newState = apply(state, event);
    expect(newState).toStrictEqual({
      courseUrl: "new-url",
      status: "COMPLETE",
      userId: "new-user"
    });
  });
});

describe("applyStatus", () => {
  it("cycles COMPLETE -> REVISIT", () => {
    expect(applyStatus("COMPLETE")).toBe("REVISIT");
  });

  it("cycles REVISIT -> INCOMPLETE", () => {
    expect(applyStatus("REVISIT")).toBe("INCOMPLETE");
  });

  it("cycles INCOMPLETE -> COMPLETE", () => {
    expect(applyStatus("INCOMPLETE")).toBe("COMPLETE");
  });
});

describe("state coverage \u{2014} full cycle is reachable", () => {
  it("reaches all three states starting from initialState", () => {
    const createdEvents = decide(COMMAND, initialState);
    const [createdEvent] = createdEvents;
    if (!createdEvent) throw new Error(ERROR_NO_EVENT);
    const stateAfterCreate = apply(initialState, createdEvent);
    expect(stateAfterCreate.status).toBe("COMPLETE");

    const events1 = decide(COMMAND, stateAfterCreate);
    const [event1] = events1;
    if (!event1) throw new Error(ERROR_NO_EVENT);
    const state1 = apply(stateAfterCreate, event1);
    expect(state1.status).toBe("REVISIT");

    const events2 = decide(COMMAND, state1);
    const [event2] = events2;
    if (!event2) throw new Error(ERROR_NO_EVENT);
    const state2 = apply(state1, event2);
    expect(state2.status).toBe("INCOMPLETE");

    const events3 = decide(COMMAND, state2);
    const [event3] = events3;
    if (!event3) throw new Error(ERROR_NO_EVENT);
    const state3 = apply(state2, event3);
    expect(state3.status).toBe("COMPLETE");
  });
});
