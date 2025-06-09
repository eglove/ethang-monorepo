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
  private _inTransaction = false;
  private readonly _subscribers = new Set<(draft: State) => void>();
  private readonly _transactionUpdates = new Set<(draft: State) => void>();

  protected constructor(state: State) {
    this._state = state;
  }

  public commitTransaction() {
    if (!this._inTransaction) {
      return;
    }

    this._state = produce(this._state, (draft: State) => {
      for (const updater of this._transactionUpdates) {
        updater(draft);
      }
    });

    this._inTransaction = false;
    this._transactionUpdates.clear();
  }

  public rollbackTransaction() {
    if (!this._inTransaction) {
      return;
    }

    this._inTransaction = false;
    this._transactionUpdates.clear();
  }

  public startTransaction() {
    if (this._inTransaction) {
      return;
    }

    this._inTransaction = true;
    this._transactionUpdates.clear();
  }

  public subscribe(callback: (state: State) => void) {
    if (0 === this._subscribers.size) {
      this._controller = new AbortController();
    }

    this._subscribers.add(callback);

    return () => {
      this._subscribers.delete(callback);

      if (0 === this._subscribers.size) {
        this._controller.abort();
      }
    };
  }

  protected update(updater: (draft: State) => void, shouldNotify = true) {
    if (this._inTransaction) {
      this._transactionUpdates.add(updater);
      return;
    }

    this._state = produce(this._state, updater);

    if (shouldNotify) {
      for (const callback of this._subscribers) {
        callback(this._state);
      }
    }
  }
}
