import { animationInterval } from "@ethang/hooks/use-animation-interval";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";
import { useSyncExternalStore } from "react";

type TodoTimerStoreProperties = {
  currentTime: string;
};

const getCurrentTime = () => {
  return DateTime.now().toLocaleString({
    dateStyle: "medium",
    timeStyle: "long",
  });
};

export class TodoTimerStore {
  public get state() {
    return this._state;
  }

  private _abortController: AbortController | null = null;

  private _state: TodoTimerStoreProperties = {
    currentTime: getCurrentTime(),
  };

  private readonly _subscribers = new Set<
    (state: TodoTimerStoreProperties) => void
  >();

  public subscribe(callback: (state: TodoTimerStoreProperties) => void) {
    if (0 === this._subscribers.size) {
      this.startTimer();
    }

    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);
      if (0 === this._subscribers.size) {
        this.destroy();
      }
    };
  }

  private destroy() {
    if (!isNil(this._abortController)) {
      this._abortController.abort();
      this._abortController = null;
    }
  }

  private notifySubscribers() {
    for (const callback of this._subscribers) {
      callback(this._state);
    }
  }

  private startTimer() {
    this._abortController = new AbortController();

    animationInterval(1000, this._abortController.signal, () => {
      this._state = {
        ...this._state,
        currentTime: getCurrentTime(),
      };
      this.notifySubscribers();
    });
  }
}

export const todoTimerStore = new TodoTimerStore();

export const useTodoTimerStore = () => {
  return useSyncExternalStore(
    (listener) => {
      return todoTimerStore.subscribe(listener);
    },
    () => todoTimerStore.state,
    () => todoTimerStore.state,
  );
};
