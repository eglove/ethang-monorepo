import { Effect, Fiber } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeStore, type Store } from "../src/store.js";

type State = { count: number; name: string };

const initial: State = { count: 0, name: "Initial" };

let store: Store<State>;

beforeEach(() => {
  store = makeStore(initial);
});

describe("waitFor", () => {
  it("resolves immediately when predicate is already true", () => {
    return Effect.runPromise(
      Effect.gen(function* () {
        yield* store.waitFor((s) => s.count === 0);
      })
    );
  });

  it("resolves after a state change satisfies the predicate", () => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const fiber = yield* store.waitFor((s) => s.count === 5).pipe(
          Effect.fork
        );

        yield* Effect.yieldNow();

        for (let index = 0; index < 5; index += 1) {
          store.update((draft) => {
            draft.count += 1;
          });
        }

        yield* Fiber.join(fiber);
        expect(store.state.count).toBe(5);
      })
    );
  });

  it("handles multiple concurrent waitFor calls with different predicates", () => {
    return Effect.runPromise(
      Effect.gen(function* () {
        const fiber1 = yield* store.waitFor((s) => s.count === 3).pipe(
          Effect.fork
        );
        const fiber2 = yield* store.waitFor((s) => s.name === "Changed").pipe(
          Effect.fork
        );

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

  it("runs the predicate against every state change", () => {
    const predicate = vi.fn((s: State) => s.count === 2);
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
