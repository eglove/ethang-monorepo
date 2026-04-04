import isError from "lodash/isError.js";
import trim from "lodash/trim.js";
import { execFile } from "node:child_process";

import type { GitAdapter } from "../ports/git-adapter.ts";

const execFileAsync = async (
  file: string,
  _arguments: readonly string[],
  options: { cwd: string },
): Promise<{ stdout: string }> =>
  new Promise((resolve, reject) => {
    execFile(file, [..._arguments], options, (error, stdout) => {
      if (null !== error) {
        reject(isError(error) ? error : new Error(String(error)));
        return;
      }
      resolve({ stdout });
    });
  });

export class ChildProcessGitAdapter implements GitAdapter {
  private readonly cwd: string;
  private lockOwner: string | undefined;

  public constructor(cwd: string) {
    this.cwd = cwd;
  }

  public acquireLock(owner: string): boolean {
    if (this.lockOwner !== undefined && this.lockOwner !== owner) {
      return false;
    }
    this.lockOwner = owner;
    return true;
  }

  public async checkout(
    branch: string,
  ): Promise<{ error?: string; ok: boolean }> {
    return this.runGit(["checkout", branch]);
  }

  public async commit(
    message: string,
  ): Promise<{ error?: string; ok: boolean }> {
    return this.runGit(["commit", "-m", message]);
  }

  public async createBranch(
    name: string,
  ): Promise<{ error?: string; ok: boolean }> {
    return this.runGit(["checkout", "-b", name]);
  }

  public async getCurrentBranch(): Promise<string> {
    const result = await this.runGit(["branch", "--show-current"]);
    if (result.ok && result.stdout !== undefined && "" !== result.stdout) {
      return trim(result.stdout);
    }
    return "";
  }

  public async push(): Promise<{ error?: string; ok: boolean }> {
    return this.runGit(["push"]);
  }

  public releaseLock(_owner: string): void {
    this.lockOwner = undefined;
  }

  private async runGit(
    gitArguments: string[],
  ): Promise<{ error?: string; ok: boolean; stdout?: string }> {
    try {
      const result = await execFileAsync("git", gitArguments, {
        cwd: this.cwd,
      });
      return { ok: true, stdout: result.stdout };
    } catch (error: unknown) {
      return {
        error: isError(error) ? error.message : String(error),
        ok: false,
      };
    }
  }
}
