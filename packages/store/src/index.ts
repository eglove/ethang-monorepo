import type { Get, Simplify } from "type-fest";

import { enablePatches, type Patch, produce } from "immer";
// attempt (lodash) for sync error handling, attemptAsync (@ethang/toolbelt) for async
import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";
import noop from "lodash/noop.js";

enablePatches();

export type StorePatch<State extends object> = Simplify<Patch> &
  (ValidDataPathTuple<State> extends infer P
    ? P extends readonly string[]
      ? Get<State, P> extends infer ValueType
        ?
            | {
                op: "add" | "replace";
                path: P;
                value: ValueType;
              }
            | {
                op: "remove";
                path: P;
                value?: never;
              }
        : never
      : never
    : never);

type Primitive = boolean | null | number | string | undefined;

type QueuedUpdate<State extends object> =
  | { kind: "produce"; updater: (draft: State) => void }
  | { kind: "replace"; state: State };

type ValidDataPathTuple<T> = T extends Primitive
  ? never
  : T extends readonly (infer U)[]
    ?
        | readonly [`${number}`]
        | (U extends object
            ? readonly [`${number}`, ...ValidDataPathTuple<U>]
            : never)
    : T extends object
      ? {
          [K in keyof T]: K extends string
            ? T[K] extends Primitive
              ? readonly [K]
              : readonly [K, ...ValidDataPathTuple<T[K]>]
            : never;
        }[keyof T]
      : never;

type WaitForResult<State extends object> =
  | { error: Error; ok: false }
  | { ok: true; value: State };

export abstract class BaseStore<State extends object> {
  public get destroyed() {
    return this._destroyed;
  }

  public get state() {
    return this._state;
  }

  protected get cleanupSignal() {
    return this._controller.signal;
  }

  private _controller: AbortController = new AbortController();
  private _destroyed = false;
  private _initialState: State;
  private _isDraining = false;
  private readonly _patchQueue: QueuedUpdate<State>[] = [];
  private _reentrantDepth = 0;
  private _state: State;
  private readonly _subscribers = new Set<(draft: State) => void>();

  protected constructor(state: State) {
    this._initialState = state;
    this._state = state;
  }

  public destroy(): void {
    if (this._destroyed) {
      return;
    }

    this._destroyed = true;
    this._controller.abort("destroy");
    this._subscribers.clear();
  }

  public reset(initialState?: State): void {
    if (this._destroyed) {
      return;
    }

    if (initialState !== undefined) {
      this._initialState = initialState;
    }

    const resetState = initialState ?? this._initialState;

    if (this._isDraining) {
      this._patchQueue.push({ kind: "replace", state: resetState });
      this._reentrantDepth += 1;
      return;
    }

    this._state = resetState;
    this.drainNotify();
  }

  public subscribe(callback: (state: State) => void) {
    if (this._destroyed) {
      return noop;
    }

    if (0 === this._subscribers.size) {
      this._controller = new AbortController();
      this.onFirstSubscriber?.();
    }

    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);

      if (0 === this._subscribers.size) {
        this._controller.abort("unmount");
        this.onLastSubscriberRemoved?.();
      }
    };
  }

  public async waitFor(
    predicate: (state: State) => boolean,
    signal?: AbortSignal,
  ): Promise<WaitForResult<State>> {
    if (this._destroyed) {
      return { error: new Error("Store is destroyed"), ok: false };
    }

    if (true === signal?.aborted) {
      return { error: new Error("Signal already aborted"), ok: false };
    }

    const immediateResult = attempt(() => predicate(this._state));
    if (isError(immediateResult)) {
      return { error: immediateResult, ok: false };
    }

    if (immediateResult) {
      return { ok: true, value: this._state };
    }

    return this.waitForAsync(predicate, signal);
  }

  protected onFirstSubscriber?(): void;

  protected onLastSubscriberRemoved?(): void;

  // onPropertyChange fires as a derived side-effect within the reentrant batch.
  // It fires for each patch from the current updater, BEFORE subscriber notification begins.
  // NOTE: onPropertyChange is NOT modeled in the TLA+ spec (see spec header lines 9-17).
  // The shouldNotify:false path used within onPropertyChange is an implementation-only concern.
  protected onPropertyChange?(patch: StorePatch<State>): void;

  protected update(updater: (draft: State) => void, shouldNotify = true) {
    if (this._destroyed) {
      return;
    }

    let patches: StorePatch<State>[] = [];

    this._state = produce(this._state, updater, (_patches) => {
      // @ts-expect-error making type stricter
      patches = _patches;
    });

    if (!shouldNotify || 0 >= patches.length) {
      return;
    }

    if (this._isDraining) {
      this.enqueueReentrant({ kind: "produce", updater });
      return;
    }

    this.drainNotify(patches);
  }

  private applyQueuedUpdate(entry: QueuedUpdate<State>): StorePatch<State>[] {
    if ("replace" === entry.kind) {
      this._state = entry.state;
      return [];
    }

    let patches: StorePatch<State>[] = [];
    this._state = produce(this._state, entry.updater, (_patches) => {
      // @ts-expect-error making type stricter
      patches = _patches;
    });
    return patches;
  }

  private drainNotify(patches?: StorePatch<State>[]) {
    this._isDraining = true;

    this.firePatches(patches);
    this.notifySubscribers();
    this.processQueue();

    this._isDraining = false;
    this._reentrantDepth = 0;
  }

  private enqueueReentrant(entry: QueuedUpdate<State>) {
    this._patchQueue.push(entry);
    this._reentrantDepth += 1;

    if (100 <= this._reentrantDepth) {
      this._patchQueue.length = 0;
      this._reentrantDepth = 0;
      queueMicrotask(() => {
        throw new Error(
          "BaseStore: reentrant depth overflow (100). Possible infinite loop in subscriber or onPropertyChange.",
        );
      });
    }
  }

  private firePatches(patches?: StorePatch<State>[]) {
    if (patches === undefined) {
      return;
    }

    for (const patch of patches) {
      if (this._destroyed) {
        break;
      }

      this.onPropertyChange?.(patch);
    }
  }

  private notifySubscribers() {
    // Snapshot subscribers to handle self-removal during iteration
    // eslint-disable-next-line unicorn/prefer-spread
    for (const callback of Array.from(this._subscribers)) {
      if (this._destroyed) {
        break;
      }

      const result = attempt(() => {
        callback(this._state);
      });

      if (isError(result)) {
        queueMicrotask(() => {
          throw result;
        });
      }
    }
  }

  private processQueue() {
    while (0 < this._patchQueue.length) {
      if (this._destroyed) {
        this._patchQueue.length = 0;
        break;
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const entry = this._patchQueue.shift()!;
      const queuedPatches = this.applyQueuedUpdate(entry);

      this.firePatches(queuedPatches);
      this.notifySubscribers();
    }
  }

  private async waitForAsync(
    predicate: (state: State) => boolean,
    signal?: AbortSignal,
  ): Promise<WaitForResult<State>> {
    return new Promise((resolve) => {
      const combinedSignal =
        signal === undefined
          ? this._controller.signal
          : AbortSignal.any([this._controller.signal, signal]);

      const reference: { unsubscribe?: () => void } = {};

      const cleanup = () => {
        combinedSignal.removeEventListener("abort", onAbort);
        reference.unsubscribe?.();
      };

      const onAbort = () => {
        cleanup();
        resolve({ error: new Error("Aborted"), ok: false });
      };

      if (combinedSignal.aborted) {
        resolve({ error: new Error("Aborted"), ok: false });
        return;
      }

      combinedSignal.addEventListener("abort", onAbort, { once: true });

      reference.unsubscribe = this.subscribe((subscriberState) => {
        const result = attempt(() => predicate(subscriberState));
        if (isError(result)) {
          cleanup();
          resolve({ error: result, ok: false });
          return;
        }

        if (result) {
          cleanup();
          resolve({ ok: true, value: subscriberState });
        }
      });
    });
  }
}
