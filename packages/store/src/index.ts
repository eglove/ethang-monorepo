import { produce } from "immer";

export abstract class BaseStore<State> {
  public get state() {
    return this._state;
  }

  protected _state: State;

  protected get cleanupSignal() {
    return this._controller.signal;
  }

  private _controller: AbortController = new AbortController();
  private readonly _subscribers = new Set<(draft: State) => void>();

  protected constructor(state: State) {
    this._state = state;
  }

  public subscribe(callback: (state: State) => void) {
    if (0 === this._subscribers.size) {
      this._controller = new AbortController();
    }

    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);

      if (0 === this._subscribers.size) {
        this._controller.abort("unmount");
      }
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
