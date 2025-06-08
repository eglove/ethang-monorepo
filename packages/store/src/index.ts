import { produce } from "immer";

export abstract class BaseStore<State> {
  public get state() {
    return this._state;
  }

  protected _state: State;
  private readonly _subscribers = new Set<(draft: State) => void>();

  protected constructor(state: State) {
    this._state = state;
  }

  public subscribe(callback: (state: State) => void) {
    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);
    };
  }

  protected update(updater: (draft: State) => void, shouldNotify = true) {
    this._state = produce(this._state, updater);

    if (shouldNotify) {
      for (const callback of this._subscribers) {
        callback(this._state);
      }
    }
  }
}
