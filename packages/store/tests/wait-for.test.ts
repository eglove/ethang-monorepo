import { Effect, Fiber } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeStore, type Store } from "../src/store.js";

type State = { count: number; name: string };

const initial: State = { count: 0, name: "Initial" };

let store: Store<State>;

beforeEach(() => {
  // eslint-disable-next-line unicorn/no-top-level-assignment-in-function
  store = makeStore(initial);
});

describe("waitFor", () => {
  it("resolves immediately when predicate is already true", async () => {
    await Effect.runPromise(
      Effect.gen(function* () {
        yield* store.waitFor((s) => {
          return 0 === s.count;
        });
      })
    );
    expect(store.state.count).toBe(0);
  });

  it("resolves after a state change satisfies the predicate", async () => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const fiber = yield* store
          .waitFor((s) => {
            return 5 === s.count;
          })
          .pipe(Effect.fork);

        yield* Effect.yieldNow();

        for (let index = 0; 5 > index; index += 1) {
          store.update((draft) => {
            draft.count += 1;
          });
        }

        yield* Fiber.join(fiber);
        expect(store.state.count).toBe(5);
      })
    );
  });

  it("handles multiple concurrent waitFor calls with different predicates", async () => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const fiber1 = yield* store
          .waitFor((s) => {
            return 3 === s.count;
          })
          .pipe(Effect.fork);
        const fiber2 = yield* store
          .waitFor((s) => {
            return "Changed" === s.name;
          })
          .pipe(Effect.fork);

        yield* Effect.yieldNow();

        store.update((draft) => {
          draft.count = 3;
        });
        store.update((draft) => {
          draft.name = "Changed";
        });

        yield* Fiber.join(fiber1);
        yield* Fiber.join(fiber2);
        expect(store.state.count).toBe(3);
        expect(store.state.name).toBe("Changed");
      })
    );
  });

  it("runs the predicate against every state change", async () => {
    const predicate = vi.fn((s: State) => {
      return 2 === s.count;
    });
    return Effect.runPromise(
      Effect.gen(function* () {
        const fiber = yield* store.waitFor(predicate).pipe(Effect.fork);
        yield* Effect.yieldNow();
        store.update((draft) => {
          draft.count = 1;
        });
        store.update((draft) => {
          draft.count = 2;
        });
        yield* Fiber.join(fiber);
        expect(predicate.mock.calls.length).toBeGreaterThanOrEqual(2);
      })
    );
  });
});
