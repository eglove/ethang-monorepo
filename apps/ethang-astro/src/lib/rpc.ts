export const unwrapRpc = async <T>(
  result: Promise<Response> | Promise<T> | T
) => {
  const data = await result;

  return data instanceof Response ? ((await data.json()) as T) : (data as T);
};
