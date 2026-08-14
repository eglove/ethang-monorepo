export type LoginOutcome =
  { error: null | string; kind: "error" } | { kind: "redirect"; path: "/" };

export type LoginResult = {
  data?: unknown;
  error?: { message?: string };
};

export function resolveLoginOutcome(
  result: LoginResult | undefined,
  urlError: null | string
) {
  if (result && !result.error) {
    return { kind: "redirect", path: "/" };
  }

  return { error: result?.error?.message ?? urlError, kind: "error" };
}
