import { useCallback, useState } from "react";

export const useBoolean = (initialValue = false) => {
  const [value, setValue] = useState<boolean>(initialValue);

  const setTrue = useCallback(() => {
    setValue(true);
  }, []);

  const setFalse = useCallback(() => {
    setValue(false);
  }, []);

  const toggle = useCallback(() => {
    setValue((_value) => {
      return !_value;
    });
  }, []);

  return {
    setFalse,
    setTrue,
    setValue,
    toggle,
    value,
  };
};
