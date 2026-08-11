export const unwrapRpc = async <T>(
  result: Promise<Response> | Promise<T> | T
) => {
  const data = await result;

  if (data instanceof Response) {
    return (await data.json()) as T;
  }

  return data as T;
};
