import { useEffect, useState } from "react";

export const useAsync = <T, E>(callback: () => Promise<T>) => {
  const [result, setResult] = useState<T>();
  const [error, setError] = useState<E>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const runAsync = async () => {
      setIsLoading(true);
      try {
        const _result = await callback();
        setResult(_result);
      } catch (_error: unknown) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        setError(_error as E);
      } finally {
        setIsLoading(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    runAsync();
  }, []);

  return {
    error,
    isLoading,
    result
  };
};
