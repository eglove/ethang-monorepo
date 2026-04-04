export type GitAdapter = {
  acquireLock: (owner: string) => boolean;
  checkout: (branch: string) => Promise<{ error?: string; ok: boolean }>;
  commit: (message: string) => Promise<{ error?: string; ok: boolean }>;
  createBranch: (name: string) => Promise<{ error?: string; ok: boolean }>;
  getCurrentBranch: () => Promise<string>;
  push: () => Promise<{ error?: string; ok: boolean }>;
  releaseLock: (owner: string) => void;
};

export function isGitSuccess(result: { ok: boolean }): boolean {
  return result.ok;
}
