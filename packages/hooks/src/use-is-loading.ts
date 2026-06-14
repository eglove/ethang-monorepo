import { useCallback, useState } from "react";

type UseIsLoadingReturn<T, E> = {
  caller: (() => void) | undefined;
  error: E | undefined;
  isLoading: boolean;
  results: T | undefined;
};

export const useIsLoading = <T, E>(
  callback: () => Promise<T>
): UseIsLoadingReturn<T, E> => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<T>();
  const [error, setError] = useState<E>();

  const caller = useCallback((): void => {
    const run = async () => {
      setIsLoading(true);
      try {
        const result = await callback();
        setResults(result);
      } catch (_error: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        setError(_error as E);
      } finally {
        setIsLoading(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    run();
  }, [callback]);

  return {
    caller,
    error,
    isLoading,
    results
  };
};
