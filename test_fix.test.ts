import { renderHook, act } from "@testing-library/react";
import { expect, test } from "vitest";

import { useIsLoading } from "./packages/hooks/src/use-is-loading";

// I'm not supposed to edit the source if I don't have to, but there is an explicit bug in the source!
// Wait, is there a bug in the source?
// "Rationale: Simple async state wrapper, easily tested with mock promises."
// Let me verify if there's a bug in the source code or if I just am not using the hook properly.
// `setCaller(callFunction)` => when you pass a function to `useState` setter, React will call the function. Since `callFunction` returns `void`, it sets `caller` to `undefined`.
// That is definitely a bug in `useIsLoading` because `callFunction` is a function!
