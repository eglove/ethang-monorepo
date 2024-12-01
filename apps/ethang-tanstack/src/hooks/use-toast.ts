"use client";

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast";

import filter from "lodash/filter.js";
import isNil from "lodash/isNil";
import map from "lodash/map";
import { useEffect, useState } from "react";

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1_000_000;

type ActionType = {
  ADD_TOAST: "ADD_TOAST";
  DISMISS_TOAST: "DISMISS_TOAST";
  REMOVE_TOAST: "REMOVE_TOAST";
  UPDATE_TOAST: "UPDATE_TOAST";
};

type ToasterToast = {
  action?: ToastActionElement;
  description?: React.ReactNode;
  id: string;
  title?: React.ReactNode;
} & ToastProps;

let count = 0;

type Action =
  | {
    toast: Partial<ToasterToast>;
    type: ActionType["UPDATE_TOAST"];
  }
  | {
    toast: ToasterToast;
    type: ActionType["ADD_TOAST"];
  }
  | {
    toastId?: ToasterToast["id"];
    type: ActionType["DISMISS_TOAST"];
  }
  | {
    toastId?: ToasterToast["id"];
    type: ActionType["REMOVE_TOAST"];
  };

type State = {
  toasts: ToasterToast[];
};

const genId = () => {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const dispatch = (action: Action) => {
  memoryState = reducer(memoryState, action);
  for (const listener of listeners) {
    listener(memoryState);
  }
};

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      toastId,
      type: "REMOVE_TOAST",
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};

// eslint-disable-next-line max-statements
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST": {
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    }

    case "DISMISS_TOAST": {
      const { toastId } = action;

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (isNil(toastId)) {
        for (const _toast of state.toasts) {
          addToRemoveQueue(_toast.id);
        }
      } else {
        addToRemoveQueue(toastId);
      }

      const newToasts = map(state.toasts, (t) => {
        if (t.id === toastId || isNil(toastId)) {
          return {
            ...t,
            open: false,
          };
        }

        return t;
      });

      return {
        ...state,
        toasts: newToasts,
      };
    }

    case "REMOVE_TOAST": {
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: filter(state.toasts, (t) => {
          return t.id !== action.toastId;
        }),
      };
    }
    case "UPDATE_TOAST": {
      const updated = map(state.toasts, (t) => {
        if (t.id === action.toast.id) {
          return {
            ...t,
            ...action.toast,
          };
        }

        return t;
      });

      return {
        ...state,
        toasts: updated,
      };
    }
  }
};

const listeners: ((state: State) => void)[] = [];

let memoryState: State = { toasts: [] };

type Toast = Omit<ToasterToast, "id">;

const toast = ({ ...properties }: Toast) => {
  const id = genId();

  const update = (_properties: ToasterToast) => {
    dispatch({
      toast: {
        ..._properties,
        id,
      },
      type: "UPDATE_TOAST",
    });
  };
  const dismiss = () => {
    dispatch({
      toastId: id,
      type: "DISMISS_TOAST",
    });
  };

  dispatch({
    toast: {
      ...properties,
      id,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
      open: true,
    },
    type: "ADD_TOAST",
  });

  return {
    dismiss,
    id,
    update,
  };
};

const useToast = () => {
  const [state, setState] = useState<State>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (-1 < index) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    dismiss: (toastId?: string) => {
      if (isNil(toastId)) {
        return;
      }

      dispatch({
        toastId,
        type: "DISMISS_TOAST",
      });
    },
    toast,
  };
};

export { toast, useToast };
