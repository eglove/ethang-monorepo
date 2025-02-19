import { useState } from "react";
import isNil from "lodash/isNil.js";

type UseToggleReturn = [value: boolean, handleToggle: () => void];

export const useToggle = (initialState = false): UseToggleReturn => {
  const [value, setValue] = useState(initialState);

  const handleToggle = (value?: boolean): void => {
    setValue((_value) => {
      if (isNil(value)) {
        return !_value;
      }

      return value;
    });
  };

  return [value, handleToggle];
};
