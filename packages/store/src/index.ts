import type { Get, Simplify } from "type-fest";

import { enablePatches, type Patch, produce } from "immer";
import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

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

type StoreOptions = {
  localStorageKey?: string;
};

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

export abstract class BaseStore<State extends object> {
  public get state() {
    return this._state;
  }

  protected get cleanupSignal() {
    return this._controller.signal;
  }

  private _controller: AbortController = new AbortController();
  private readonly _options: StoreOptions | undefined;
  private _state: State;
  private readonly _subscribers = new Set<(draft: State) => void>();

  protected constructor(state: State, options?: StoreOptions) {
    this._options = options;
    this._state = this.syncLocalStorage(state);
  }

  public subscribe(callback: (state: State) => void) {
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

  protected onFirstSubscriber?(): void;

  protected onLastSubscriberRemoved?(): void;

  protected onPropertyChange?(patch: StorePatch<State>): void;
  protected update(updater: (draft: State) => void, shouldNotify = true) {
    let patches: StorePatch<State>[] = [];

    this._state = produce(this._state, updater, (_patches) => {
      // @ts-expect-error making type stricter
      patches = _patches;
    });
    this.setLocalStorage();

    if (shouldNotify && 0 < patches.length) {
      for (const patch of patches) {
        this.onPropertyChange?.(patch);
      }

      for (const callback of this._subscribers) {
        callback(this._state);
      }
    }
  }

  private getLocalStorage() {
    if (isNil(this._options?.localStorageKey)) {
      return;
    }

    return globalThis.localStorage.getItem(this._options.localStorageKey);
  }

  private setLocalStorage(state?: State) {
    if (!isNil(this._options?.localStorageKey)) {
      globalThis.localStorage.setItem(
        this._options.localStorageKey,
        JSON.stringify(isNil(state) ? this._state : state),
      );
    }
  }

  private syncLocalStorage(state: State) {
    if (isNil(this._options?.localStorageKey)) {
      return state;
    }
    const storage = this.getLocalStorage();

    if (isNil(storage)) {
      this.setLocalStorage(state);
      return state;
    }
    const parsed = attempt(() => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return JSON.parse(storage) as State;
    });

    if (isError(parsed)) {
      this.setLocalStorage(state);
      return state;
    }

    return parsed;
  }
}
