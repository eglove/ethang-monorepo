export const unwrapRpc = async <T>(result: Promise<T> | Promise<Response> | T) => {
    const data = await result;
  
  if (data instanceof Response) {
    return (await data.json()) as T;
  }
  
  return data as T;
}