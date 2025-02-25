import { type Draft, produce } from "immer";

export type Listener<TState> = (state: TState) => void;

type Derived<TState> = {
  compute: (state: TState) => unknown;
  dependencies: Set<keyof TState>;
  value: unknown;
};

type StoreConfig = {
  localStorageKey?: string;
  syncToLocalStorage?: boolean;
};

export class Store<TState extends object> {
  private readonly _config?:
    | ({ localStorageKey: string } & StoreConfig)
    | undefined;

  private readonly _derived = new Map<string, Derived<TState>>();

  private readonly _elementListeners = new Map<string, HTMLElement>();

  private readonly _initialState: TState;

  private readonly _listeners = new Set<Listener<TState>>();

  private _state: TState;

  private set state(state: TState) {
    this._state = state;
    this.notifySubscribers();
  }

  private get state() {
    return this._state;
  }

  public constructor(initialState: TState, config?: StoreConfig) {
    this._config = {
      ...config,
      localStorageKey: config?.localStorageKey ?? "store",
    };

    this._state = this.getInitialState(initialState);
    this._initialState = initialState;
  }

  public addDerived<TValue>(key: string, compute: (state: TState) => TValue) {
    if (this._derived.has(key)) {
      globalThis.console.error(
        `Derived value with key "${key}" already exists`,
      );
      return;
    }

    const dependencies = new Set<keyof TState>();

    const proxy = new Proxy(this.state, {
      // @ts-expect-error TState extends object
      get: (target: TState, property: keyof TState) => {
        dependencies.add(property);
        return target[property];
      },
    });

    const initialValue = compute(proxy);

    this._derived.set(key, {
      compute,
      dependencies,
      value: initialValue,
    });

    return initialValue;
  }

  public bind<E>(onUpdate: (state: TState, element: E) => void) {
    const id = this.getElementListenerId();

    return (element: E | null) => {
      if (null !== element) {
        const updateElement = () => {
          const cleanedUp = this.cleanup(id, updateElement);
          if (!cleanedUp) {
            onUpdate(this.state, element);
          }
        };

        updateElement();
        this._listeners.add(updateElement);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        (element as HTMLElement).dataset["listenerId"] = id;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        this._elementListeners.set(id, element as HTMLElement);
      }
    };
  }

  public get(): TState;
  public get<T>(selector: (state: TState) => T): T;
  public get<T>(selector?: (state: TState) => T) {
    if (!selector) {
      return this.state;
    }

    return selector(this.state);
  }

  public getDerived<TValue>(key: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return this._derived.get(key)?.value as TValue | undefined;
  }

  public notifySubscribers() {
    for (const derived of this._derived.values()) {
      const newValue = derived.compute(this.state);

      if (!Object.is(derived.value, newValue)) {
        derived.value = newValue;
      }
    }

    for (const listener of this._listeners) {
      listener(this.state);
    }
  }

  public resetState() {
    this.state = this._initialState;
  }

  public set(updater: (draft: Draft<TState>) => void) {
    const value = produce(this.state, updater);
    this.state = value;

    if (true === this._config?.syncToLocalStorage) {
      globalThis.localStorage.setItem(
        this._config.localStorageKey,
        JSON.stringify(value),
      );
    }
  }

  public subscribe(listener: Listener<TState>) {
    this._listeners.add(listener);

    return () => {
      this._listeners.delete(listener);
    };
  }

  private cleanup(id: string, updateElement: Listener<TState>): boolean {
    if (this._elementListeners.has(id) && "undefined" !== typeof globalThis) {
      const foundElement = globalThis.document.querySelector(
        `[data-listener-id="${id}"]`,
      );

      if (!foundElement) {
        this._elementListeners.delete(id);
        this._listeners.delete(updateElement);
        return true;
      }
    }

    return false;
  }

  private getElementListenerId() {
    const genId = (id = 0) => {
      const idString = `${Date.now()}-${id}`;

      if (this._elementListeners.has(idString)) {
        return genId(id + 1);
      }
      return idString;
    };

    return genId();
  }

  private getInitialState(initialState: TState) {
    if (this._config && true === this._config.syncToLocalStorage) {
      const storedState = globalThis.localStorage.getItem(
        this._config.localStorageKey,
      );

      if (null === storedState) {
        return initialState;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      return JSON.parse(storedState) as TState;
    }

    return initialState;
  }
}
