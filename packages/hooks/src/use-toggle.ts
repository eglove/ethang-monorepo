import isNil from "lodash/isNil.js";
import { useState } from "react";

export const useToggle = (initialState = false) => {
  const [intervalValue, setIntervalValue] = useState(initialState);

  const handleToggle = (value?: false | true): void => {
    setIntervalValue((_value) => {
      if (isNil(value)) {
        return !_value;
      }

      return value;
    });
  };

  return [intervalValue, handleToggle] as const;
};
