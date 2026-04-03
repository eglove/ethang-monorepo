/**
 * Quorum formula: ceil(2n/3)
 *
 * Computes the minimum number of reviewer approvals required
 * for the review gate to pass.
 *
 * @param n - Number of non-UNAVAILABLE reviewers (must be >= 1)
 * @returns The quorum threshold
 * @throws Error if n < 1 (floor guard)
 */
export function quorum(n: number): number {
  if (n < 1) {
    throw new Error(
      `Quorum floor guard: n must be >= 1, got ${String(n)}`,
    );
  }

  return Math.ceil((2 * n) / 3);
}
