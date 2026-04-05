/* eslint-disable max-classes-per-file */
import { BaseStore } from "@ethang/store";

import type { GitOperations } from "../util/interfaces.ts";

import { ErrorKind, ok, type Result, resultError } from "../util/result.ts";

export type GitStoreState = {
  status: "busy" | "error" | "idle";
};

export type TestGitStore = {
  injectOutput: (method: string, output: string) => void;
  store: GitStore;
};

export class GitStore
  extends BaseStore<GitStoreState>
  implements GitOperations
{
  public constructor() {
    super({ status: "idle" });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async add(_files: readonly string[]): Promise<Result<string>> {
    return resultError(ErrorKind.NotImplemented, "Git add not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async commit(_message: string): Promise<Result<string>> {
    return resultError(ErrorKind.NotImplemented, "Git commit not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async createBranch(_name: string): Promise<Result<string>> {
    return resultError(
      ErrorKind.NotImplemented,
      "Git createBranch not implemented",
    );
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async diff(): Promise<Result<string>> {
    return resultError(ErrorKind.NotImplemented, "Git diff not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async status(): Promise<Result<string>> {
    return resultError(ErrorKind.NotImplemented, "Git status not implemented");
  }
}

export const createTestGitStore = (): TestGitStore => {
  const outputs = new Map<string, string>();

  const store = new (class extends GitStore {
    // eslint-disable-next-line @typescript-eslint/require-await
    public override async add(
      _files: readonly string[],
    ): Promise<Result<string>> {
      return ok(outputs.get("add") ?? "added");
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public override async commit(_message: string): Promise<Result<string>> {
      return ok(outputs.get("commit") ?? "sha123");
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public override async createBranch(_name: string): Promise<Result<string>> {
      return ok(outputs.get("createBranch") ?? "branch-created");
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public override async diff(): Promise<Result<string>> {
      return ok(outputs.get("diff") ?? "");
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public override async status(): Promise<Result<string>> {
      return ok(outputs.get("status") ?? "clean");
    }
  })();

  return {
    injectOutput: (method: string, output: string) => {
      outputs.set(method, output);
    },
    store,
  };
};
