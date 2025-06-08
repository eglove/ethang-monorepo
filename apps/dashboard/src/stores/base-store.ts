import { produce } from "immer";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

export abstract class BaseStore<State> {
  public get state() {
    return this._state;
  }

  private _state: State;
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

  private update(updater: (draft: State) => void, shouldNotify = true) {
    this._state = produce(this._state, updater);

    if (shouldNotify) {
      for (const callback of this._subscribers) {
        callback(this._state);
      }
    }
  }
}

export const useStore = <State, Selection>(
  store: BaseStore<State>,
  selector: (snapshot: ApplicationStoreState) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
) => {
  return useSyncExternalStoreWithSelector(
    (listener) => {
      return store.subscribe(listener);
    },
    () => store.state,
    () => store.state,
    selector,
    isEqual,
  );
};
