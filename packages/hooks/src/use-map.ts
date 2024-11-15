import { useState } from "react";

export const useMap = <T, U,>(
  values?: [T, U][] | null,
): Map<T, U> => {
  const [map, setMap] = useState(new Map(values));

  map.set = (key: T, value: U): Map<T, U> => {
    const _map = new Map(map);
    const returnValue = _map.set(key, value);

    setMap(_map);
    return returnValue;
  };

  map.delete = (key: T): boolean => {
    const _map = new Map(map);
    const returnValue = _map.delete(key);

    setMap(_map);
    return returnValue;
  };

  map.clear = (): void => {
    const _map = new Map(map);
    _map.clear();

    setMap(_map);
  };

  return map;
};
