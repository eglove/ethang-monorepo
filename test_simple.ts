import { renderHook, act } from "@testing-library/react";
import { useIsLoading } from "./packages/hooks/src/use-is-loading";

const mockPromise = () => Promise.resolve();

const { result } = renderHook(() => useIsLoading(mockPromise));

console.log("initial loading:", result.current.isLoading);

act(() => {
    result.current.caller?.();
})

console.log("loading after caller:", result.current.isLoading);
