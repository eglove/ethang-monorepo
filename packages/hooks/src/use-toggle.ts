import isNil from "lodash/isNil.js";
import { useState } from "react";

type UseToggleReturn = [value: boolean, handleToggle: () => void];

export const useToggle = (initialState = false): UseToggleReturn => {
  const [intervalValue, setIntervalValue] = useState(initialState);

  const handleToggle = (value?: false | true): void => {
    setIntervalValue((_value) => {
      if (isNil(value)) {
        return !_value;
      }

      return value;
    });
  };

  return [intervalValue, handleToggle];
};
