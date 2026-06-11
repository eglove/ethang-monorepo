// Testing the fix locally
export const useIsLoading = <T, E>(
  callback: () => Promise<T>
) => {
    // If I do:
    // setCaller(() => callFunction);
    // then the state gets set to callFunction!
    return callback;
}
