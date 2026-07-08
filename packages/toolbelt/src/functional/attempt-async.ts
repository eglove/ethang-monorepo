import isError from "lodash/isError.js";

export const attemptAsync = async <A>(
  callback: () => Promise<A>
): Promise<A | Error> => {
  try {
    return await callback();
  } catch (error: unknown) {
    return isError(error) ? error : new Error(`${callback.name} failed`);
  }
};
