import get from "lodash/get.js";
import isElement from "lodash/isElement.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import merge from "lodash/merge.js";
import { v7 } from "uuid";

type CosmosConfig = {
  debug?: boolean;
};

type EventListenerFilters<T extends keyof WindowEventMapPlus> = {
  eventName?: T;
  eventTarget?: EventTarget;
  id?: string;
  listener?: EventListenerOrEventListenerObject;
  options?: boolean | EventListenerOptions | undefined;
};

type ExtraEventListenerOptions = {
  cleanup?: () => boolean;
  isNative?: boolean;
};

type Listener<T> = T extends keyof WindowEventMap
  ? (this: Window, event_: WindowEventMap[T]) => unknown
  : EventListenerOrEventListenerObject;

type StoredListener<T extends keyof WindowEventMapPlus> = {
  eventName: T;
  eventTarget: EventTarget;
  id: string;
  listener: Listener<keyof WindowEventMapPlus>;
  options?: AddEventListenerOptions | boolean | undefined;
};

type WindowEventMapPlus = Record<string, unknown> & WindowEventMap;

export class Cosmos {
  public get eventListenersSize() {
    return this._nativeListeners.size;
  }

  private readonly _debug: boolean | undefined;
  private readonly _nativeListeners = new Map<string, StoredListener<string>>();
  private readonly _observer: MutationObserver;

  public constructor(config?: CosmosConfig) {
    this._debug = config?.debug;

    const originalAddEventListener = get(globalThis, [
      "EventTarget",
      "prototype",
      "addEventListener",
    ]);
    const originalRemoveEventListener = get(globalThis, [
      "EventTarget",
      "prototype",
      "removeEventListener",
    ]);
    // eslint-disable-next-line @typescript-eslint/no-this-alias,unicorn/no-this-assignment
    const cosmos = this;

    globalThis.EventTarget.prototype.addEventListener = function (
      this: EventTarget,
      eventName: string,
      listener: EventListenerOrEventListenerObject,
      options?: (AddEventListenerOptions | boolean) & ExtraEventListenerOptions,
    ) {
      if (false !== options?.isNative) {
        cosmos.addEventListener(this, eventName, listener, options);
      }

      const cleanup = options?.cleanup?.();

      if (true === cleanup) {
        cosmos.removeEventListeners({ eventName, listener, options });
      } else {
        originalAddEventListener.call(this, eventName, listener, options);
      }
    };

    globalThis.EventTarget.prototype.removeEventListener = function (
      eventName: string,
      listener: EventListenerOrEventListenerObject,
      options?: (AddEventListenerOptions | boolean) & ExtraEventListenerOptions,
    ) {
      if (false !== options?.isNative) {
        cosmos.removeEventListeners({
          eventName,
          listener,
          options,
        });
      }

      originalRemoveEventListener.call(this, eventName, listener, options);
    };

    this._observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // eslint-disable-next-line unicorn/no-array-for-each,lodash/prefer-lodash-method
        mutation.removedNodes.forEach((node) => {
          if (isElement(node)) {
            this.removeEventListeners({ eventTarget: node });
          }
        });
      }
    });

    this._observer.observe(globalThis.document, {
      childList: true,
      subtree: true,
    });
  }

  public addEventListener<T extends keyof WindowEventMapPlus>(
    element: EventTarget,
    eventName: T,
    listener: Listener<T>,
    options?: (AddEventListenerOptions | boolean) & ExtraEventListenerOptions,
  ) {
    const id = v7();

    this._nativeListeners.set(id, {
      eventName,
      eventTarget: element,
      id,
      listener,
      options,
    });

    element.addEventListener(
      eventName,
      listener,
      merge(options, { isNative: false }),
    );

    if (true === this._debug) {
      globalThis.console.log("Added event listener", id);
    }

    return id;
  }

  public getEventListeners<T extends keyof WindowEventMapPlus>(
    filters?: EventListenerFilters<T>,
  ) {
    const result: StoredListener<string>[] = [];

    this.onEventListenerFilter(filters ?? {}, (_, listener) => {
      result.push(listener);
    });

    return result;
  }

  public removeEventListener(id: string) {
    const listener = this._nativeListeners.get(id);

    if (isNil(listener)) {
      if (true === this._debug) {
        globalThis.console.warn("No event listener found for id", id);
      }

      return false;
    }

    this._nativeListeners.delete(id);
    listener.eventTarget.removeEventListener(
      listener.eventName,
      listener.listener,
      merge(get(listener, ["options"], {} as AddEventListenerOptions), {
        isNative: false,
      }),
    );

    if (true === this._debug) {
      globalThis.console.log("Removed event listener", id);
    }

    return true;
  }

  public removeEventListeners<T extends keyof WindowEventMapPlus>(
    filters?: EventListenerFilters<T>,
  ) {
    this.onEventListenerFilter(filters ?? {}, (id) => {
      this.removeEventListener(id);
    });
  }

  /*
   * Uses priority filtering.
   * 1st priority: If Id is defined in filters, callback will run based on id.
   * 2nd priority: Listener + EventName
   * 3rd priority: Listener + EventName + Options
   * 4th: EventName + Target
   * 5th: EvenName OR Target
   */
  // eslint-disable-next-line sonar/cognitive-complexity
  private onEventListenerFilter<T extends keyof WindowEventMapPlus>(
    filters: EventListenerFilters<T>,
    callback: (id: string, listener: StoredListener<string>) => void,
  ) {
    for (const [id, listener] of this._nativeListeners) {
      const isOptionsEmpty = isNil(filters.options) || isEmpty(filters.options);

      const isIsIdEqual = !isNil(filters.id) && id === filters.id;

      const isEventNameEqual =
        !isNil(filters.eventName) && filters.eventName === listener.eventName;
      const isListenerEqual =
        !isNil(filters.listener) && filters.listener === listener.listener;
      const isOptionsEqual =
        !isNil(filters.options) && filters.options === listener.options;

      const isTargetEqual =
        !isNil(filters.eventTarget) &&
        listener.eventTarget === filters.eventTarget;

      if (isIsIdEqual) {
        callback(id, listener);
      } else if (isEventNameEqual && isListenerEqual && isOptionsEmpty) {
        callback(id, listener);
      } else if (isEventNameEqual && isListenerEqual && isOptionsEqual) {
        callback(id, listener);
      } else if (isEventNameEqual && isTargetEqual) {
        callback(id, listener);
      } else if (
        isEventNameEqual ||
        isTargetEqual ||
        isListenerEqual ||
        isOptionsEqual
      ) {
        callback(id, listener);
      } else if (isEmpty(filters)) {
        callback(id, listener);
      } else {
        // Nothing
      }
    }
  }
}
