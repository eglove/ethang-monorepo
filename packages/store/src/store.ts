import { Chunk, Effect, PubSub, Stream } from "effect";
import { enableMapSet, produce, type Producer } from "immer";
import forEach from "lodash/forEach.js";

enableMapSet();

export type Store<T> = {
  /**
  `Stream.Stream<T>` that emits the current state immediately on subscribe,
  then every subsequent value published by `set` / `update` / `reset`.
  Use this for backend / Effect-based consumption (e.g. `waitFor`).
  */
  readonly changes: Stream.Stream<T>;
  /**
  Synchronous getter for the current state. Equivalent to `state`.
  */
  readonly get: T;
  /**
  Reset the store. With no argument, restores the most recent
  `initial` (or the most recent `reset(value)` value). With an argument,
  stores that as the new "initial" for subsequent `reset()` calls.
  Returns the new value synchronously.
  */
  readonly reset: (value?: T) => T;
  /**
  Replace the state with `value` and notify subscribers. Synchronous.
  Returns the new value.
  */
  readonly set: (value: T) => T;
  /**
  Synchronous getter for the current state. Equivalent to `get`.
  */
  readonly state: T;
  /**
  Subscribe to state changes. The listener fires synchronously after every
  `set` / `update` / `reset` call. Returns an unsubscribe function.
  */
  readonly subscribe: (listener: () => void) => () => void;
  /**
  Apply an Immer recipe to the current state. The `draft` is a mutable
  proxy: `draft.count += 1` is equivalent to `{ ...d, count: d.count + 1 }`.
  Recipes may also return a new value (which Immer will adopt as the next
  state if it differs from the draft). Synchronous. Returns the new value.
  */
  readonly update: (recipe: Producer<T>) => T;
  /**
  Effect that resolves the first time `isMatch(state)` is true. Resolves
  immediately if the predicate is already true. Use this for backend /
  long-lived consumers; for React, prefer `useStore` + `subscribe`.
  */
  readonly waitFor: (isMatch: (state: T) => boolean) => Effect.Effect<void>;
};

/**
Create a new `Store<T>` from an initial value.

The store's `set`, `update`, and `reset` methods are **synchronous** and
return the new state. State changes propagate through two channels:

  1. A synchronous `Set<listener>` invoked from `subscribe` (used by the
     React adapter).
  2. An Effect `PubSub` consumed by `store.changes` (used by `waitFor`
     and any backend / `Effect.gen` consumer).

`update` is powered by Immer, so consumers can write mutable-style
recipes: `store.update((draft) => { draft.count += 1 })`. This avoids
the `{ ...d, ... }` spread noise while still producing immutable state
under the hood.
*/
export const makeStore = <T>(initial: T): Store<T> => {
  // The state itself lives in a closure variable so reads and writes are
  // plain synchronous JS. The Effect `PubSub` is the only place state
  // crosses into the Effect world; everything else is sync.
  let current: T = initial;
  // Track the most-recently `reset(value)` value so `reset()` (no arg) can
  // return to it. `set` / `update` deliberately do NOT touch this so that
  // a bare `reset()` always falls back to either the original `initial`
  // or the most recent explicit `reset(value)` — matching the semantic
  // consumers relied on under the old `BaseStore`.
  let lastReset: T = initial;
  const pubsub = Effect.runSync(PubSub.unbounded<T>());
  // Synchronous listener set for the React adapter. Listeners are called
  // synchronously after the underlying state is updated so React sees a
  // consistent value when it re-reads `getSnapshot`.
  const listeners = new Set<() => void>();

  const notify = () => {
    forEach([...listeners], (listener) => {
      listener();
    });
  };

  const commit = (next: T): T => {
    current = next;
    notify();
    // Fire-and-forget publish: the synchronous API doesn't surface
    // PubSub backpressure, and `Stream.fromPubSub` consumers will
    // simply receive the latest value on the next pump. Failure to
    // enqueue is non-fatal because the synchronous listener path has
    // already been notified.
    Effect.runFork(PubSub.publish(pubsub, next));
    return next;
  };

  // `changes` mirrors `SubscriptionRef.changes`: on subscribe, the
  // **factory-time** value is emitted first, then every subsequent publish
  // from the pubsub is forwarded. `Stream.fromPubSub` (no `scoped: true`)
  // auto-binds the pubsub subscription's `Scope` to the consumer's ambient
  // scope, so cleanup is automatic when the consumer's scope closes.
  //
  // The factory-time initial value is acceptable because:
  //   - The React adapter (`useStore`) subscribes the very first time the
  //     hook is called, before any `set`/`update` has happened, so the
  //     initial emission matches the current state.
  //   - `waitFor` reads the current value synchronously *before* consuming
  //     the stream, so it doesn't depend on the initial emission.
  //
  // `Stream.fromChunk` + `Chunk.of` is used (not `Stream.make`) because
  // `Stream.make` relies on a variadic internal Effect instruction that
  // gets minified away by Vitest's bundler, surfacing as
  // `op.effect_instruction_i0 is not a function`.
  const changes: Stream.Stream<T> = Stream.concat(
    Stream.fromChunk(Chunk.of(initial)),
    Stream.fromPubSub(pubsub)
  );

  const store: Store<T> = {
    changes,
    get get() {
      return current;
    },
    reset: (value) => {
      const next = value ?? lastReset;
      lastReset = next;
      return commit(next);
    },
    set: (value) => {
      return commit(value);
    },
    get state() {
      return current;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    update: (recipe: Producer<T>) => {
      const next: T = produce(current, recipe);
      if (Object.is(next, current)) {
        // Immer returned the same reference: nothing changed, skip the
        // notify / publish round-trip.
        return current;
      }
      return commit(next);
    },
    waitFor: (isMatch) => {
      return Effect.gen(function* () {
        if (isMatch(current)) {
          return;
        }
        yield* Stream.filter(changes, isMatch).pipe(
          Stream.take(1),
          Stream.runDrain
        );
      });
    }
  };

  return store;
};

// Convenience: read a `Store<T>` synchronously. Exposed for the React adapter.
export const readUnsafe = <T>(store: Store<T>): T => {
  return store.state;
};
