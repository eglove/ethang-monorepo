import { useEffect, useState } from "react";

export const useAsync = <T, E,>(callback: () => Promise<T>) => {
  const [result, setResult] = useState<T>();
  const [error, setError] = useState<E>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    callback()
      .then((_result) => {
        setResult(_result);
      })
      .catch((_error: unknown) => {
        setError(_error as E);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return {
    error,
    isLoading,
    result,
  };
};
