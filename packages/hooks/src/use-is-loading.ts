import { useEffect, useState } from "react";

type UseIsLoadingReturn<T, E,> = {
  caller: (() => void) | undefined;
  error: E | undefined;
  isLoading: boolean;
  results: T | undefined;
};

export const useIsLoading = <T, E,>(
  callback: () => Promise<T>,
): UseIsLoadingReturn<T, E> => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<T>();
  const [error, setError] = useState<E>();
  const [caller, setCaller] = useState<() => void>();

  useEffect(() => {
    const callFunction = (): void => {
      setIsLoading(true);
      callback()
        .then((result) => {
          setResults(result);
        })
        .catch((_error: unknown) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          setError(_error as E);
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    setCaller(callFunction);
  }, [callback]);

  return {
    caller,
    error,
    isLoading,
    results,
  };
};
