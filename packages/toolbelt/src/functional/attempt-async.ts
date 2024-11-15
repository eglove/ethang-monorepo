import isError from "lodash/isError.js";

export const attemptAsync = async <
  T extends (...parameters: Parameters<T>) => unknown,
>
(
  callback: T,
  ...parameters: Parameters<T>
): Promise<Awaited<ReturnType<T>> | Error> => {
  try {
    // Assume this is used with async function, force the await to catch the error
    return (await callback(...parameters)) as Awaited<ReturnType<T>>;
  } catch (error: unknown) {
    return isError(error)
      ? error
      : new Error(`${callback.name} failed`);
  }
};
