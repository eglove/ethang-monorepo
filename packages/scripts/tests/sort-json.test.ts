import type process from "node:process";

import constant from "lodash/constant.js";
import noop from "lodash/noop.js";
import {
  type Dirent,
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync
} from "node:fs";
import path from "node:path";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type MockInstance,
  vi
} from "vitest";

import {
  findFilesRecursively,
  recursiveSort,
  sortJson
} from "../sort-json-utilities.ts";
import { run } from "../sort-json.ts";

const TARGET_JSON = "target.json";
const SORT_JSON_SCRIPT = "sort-json.ts";

class MockDirent implements Dirent {
  public isBlockDevice = constant(false);
  public isCharacterDevice = constant(false);
  public isFIFO = constant(false);
  public isSocket = constant(false);
  public isSymbolicLink = constant(false);

  public name: string;

  public parentPath: string;

  public path: string;

  private readonly _isDirectory: boolean;
  public constructor(name: string, isDirectory: boolean) {
    this.name = name;
    this._isDirectory = isDirectory;
    this.parentPath = "";
    this.path = "";
  }
  public isDirectory(): boolean {
    return this._isDirectory;
  }
  public isFile(): boolean {
    return !this._isDirectory;
  }
}

vi.mock("node:fs", async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  return {
    ...original,
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn()
  };
});

describe("sort-json utilities", () => {
  describe("recursiveSort", () => {
    it("should correctly sort objects and nested objects/arrays", () => {
      const object = { a: 2, arr: [{ x: 2, y: 1 }], z: 1 };
      const sorted = recursiveSort(object);

      expect(sorted).toStrictEqual({
        a: 2,
        arr: [{ x: 2, y: 1 }],
        z: 1
      });
    });

    it("should return primitive values unchanged", () => {
      expect(recursiveSort(42)).toBe(42);
      expect(recursiveSort("test")).toBe("test");
      expect(recursiveSort(null)).toBeNull();
    });
  });

  describe("sortJson", () => {
    it("should reject file paths that are outside of the workspace directory", () => {
      const outsidePath = path.resolve("../../../outside-file.json");

      expect(() => {
        sortJson(outsidePath);
      }).toThrow(/Path is outside/iu);
    });

    it("should throw an error if file does not exist", () => {
      vi.mocked(existsSync).mockReturnValueOnce(false);

      expect(() => {
        sortJson("non-existent.json");
      }).toThrow(/File does not exist/iu);
    });

    it("should exit and log error if JSON is malformed", () => {
      vi.mocked(existsSync).mockReturnValueOnce(true);
      vi.mocked(readFileSync).mockReturnValueOnce("malformed-json");

      const consoleErrorSpy = vi
        .spyOn(globalThis.console, "error")
        .mockImplementation(noop);

      sortJson("malformed.json");

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it("should successfully sort and write JSON to file", () => {
      vi.mocked(existsSync).mockReturnValueOnce(true);
      vi.mocked(readFileSync).mockReturnValueOnce('{"z":1,"a":2}');
      const writeSpy = vi.mocked(writeFileSync);

      sortJson("valid.json");

      expect(writeSpy).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify({ a: 2, z: 1 }, null, 2),
        "utf8"
      );
    });
  });

  describe("findFilesRecursively", () => {
    it("should recursively locate matching files and ignore node_modules/dist", () => {
      const mockDirectoryEntries = [
        new MockDirent("node_modules", true),
        new MockDirent("dist", true),
        new MockDirent("src", true),
        new MockDirent(TARGET_JSON, false)
      ];

      vi.mocked(readdirSync)

        .mockReturnValueOnce(mockDirectoryEntries as any) // root

        .mockReturnValueOnce([new MockDirent(TARGET_JSON, false)] as any); // src

      const results = findFilesRecursively("root", TARGET_JSON);

      expect(results).toContain(path.join("root", TARGET_JSON));
      expect(results).toContain(path.join("root", "src", TARGET_JSON));
    });
  });

  describe("sortJson entrypoint script", () => {
    let originalArgv: string[];
    let exitSpy: MockInstance<typeof process.exit>;
    let consoleErrorSpy: MockInstance<typeof console.error>;

    beforeEach(() => {
      originalArgv = globalThis.process.argv;
      exitSpy = vi
        .spyOn(globalThis.process, "exit")
        .mockImplementation((code) => {
          throw new Error(`exit:${code}`);
        });
      consoleErrorSpy = vi
        .spyOn(globalThis.console, "error")
        .mockImplementation(noop);
    });

    afterEach(() => {
      globalThis.process.argv = originalArgv;
      exitSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it("should exit with 1 if no file path is provided", () => {
      expect(() => {
        run(["node", SORT_JSON_SCRIPT]);
      }).toThrow("exit:1");

      expect(consoleErrorSpy).toHaveBeenCalledWith("No file path provided");
    });

    it("should exit with 1 if path is outside workspace", () => {
      expect(() => {
        run(["node", SORT_JSON_SCRIPT, "../../../outside.json"]);
      }).toThrow("exit:1");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Path is outside the repository workspace"
      );
    });

    it("should exit with 1 if file does not exist", () => {
      vi.mocked(existsSync).mockReturnValueOnce(false);

      expect(() => {
        run(["node", SORT_JSON_SCRIPT, "non-existent.json"]);
      }).toThrow("exit:1");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "File does not exist:",
        expect.any(String)
      );
    });

    it("should run sortJson for a valid file path", () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFileSync).mockReturnValueOnce('{"a":1}');
      run(["node", SORT_JSON_SCRIPT, "valid.json"]);

      expect(exitSpy).not.toHaveBeenCalled();
    });
  });
});
