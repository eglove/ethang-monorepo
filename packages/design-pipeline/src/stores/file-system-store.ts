/* eslint-disable max-classes-per-file */
import { BaseStore } from "@ethang/store";

import type { FileOperations } from "../util/interfaces.ts";

import { ErrorKind, ok, type Result, resultError } from "../util/result.ts";

export type FileSystemStoreState = {
  status: "busy" | "error" | "idle";
};

export type TestFileSystemStore = {
  setFile: (path: string, content: string) => void;
  store: FileSystemStore;
};

export class FileSystemStore
  extends BaseStore<FileSystemStoreState>
  implements FileOperations
{
  public constructor() {
    super({ status: "idle" });
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async exists(_path: string): Promise<Result<boolean>> {
    return resultError(ErrorKind.NotImplemented, "exists not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async mkdir(_path: string): Promise<Result<void>> {
    return resultError(ErrorKind.NotImplemented, "mkdir not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async readFile(_path: string): Promise<Result<string>> {
    return resultError(ErrorKind.NotImplemented, "readFile not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async writeFile(
    _path: string,
    _content: string,
  ): Promise<Result<void>> {
    return resultError(ErrorKind.NotImplemented, "writeFile not implemented");
  }
}

export const createTestFileSystemStore = (): TestFileSystemStore => {
  const files = new Map<string, string>();

  const store = new (class extends FileSystemStore {
    // eslint-disable-next-line @typescript-eslint/require-await
    public override async exists(path: string): Promise<Result<boolean>> {
      return ok(files.has(path));
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public override async mkdir(_path: string): Promise<Result<void>> {
      return ok();
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public override async readFile(path: string): Promise<Result<string>> {
      const content = files.get(path);
      if (undefined === content) {
        return resultError(
          ErrorKind.FileSystemError,
          `File not found: ${path}`,
        );
      }

      return ok(content);
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    public override async writeFile(
      path: string,
      content: string,
    ): Promise<Result<void>> {
      files.set(path, content);
      return ok();
    }
  })();

  return {
    setFile: (path: string, content: string) => {
      files.set(path, content);
    },
    store,
  };
};
