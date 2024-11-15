import { useState } from "react";

export const useSet = <SetType,>(
  values?: Readonly<null | SetType[] | undefined>,
): Set<SetType> => {
  const [set, setSet] = useState(new Set(values));

  set.add = (value: SetType): Set<SetType> => {
    const _set = new Set(set);
    const returnValue = _set.add(value);

    setSet(_set);

    return returnValue;
  };

  set.delete = (value: SetType): boolean => {
    const _set = new Set(set);
    const returnValue = _set.delete(value);

    setSet(_set);

    return returnValue;
  };

  set.clear = (): void => {
    const _set = new Set(set);
    _set.clear();

    setSet(_set);
  };

  return set;
};
