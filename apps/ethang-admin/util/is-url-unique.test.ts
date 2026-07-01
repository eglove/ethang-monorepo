import { describe, expect, it, vi } from "vitest";

import { isUrlUnique } from "./is-url-unique.ts";

const TEST_URL = "https://google.com";
const TEST_DOC_ID = "123";
const TEST_DOC_TYPE = "post";

describe("isUrlUnique validation rule", () => {
  it("should return error if value is empty/nil and isRequired is true", async () => {
    const mockRule = {
      custom: vi.fn((validationCallback) => {
        return validationCallback;
      })
    };

    // @ts-expect-error mock rule
    const validator = isUrlUnique(mockRule, true, TEST_DOC_TYPE);

    // @ts-expect-error mock context
    const result = await validator(undefined, {});
    expect(result).toBe("URL is required.");
  });

  it("should return true if value is empty/nil and isRequired is false", async () => {
    const mockRule = {
      custom: vi.fn((validationCallback) => {
        return validationCallback;
      })
    };

    // @ts-expect-error mock rule
    const validator = isUrlUnique(mockRule, false, TEST_DOC_TYPE);

    // @ts-expect-error mock context
    const result = await validator(undefined, {});
    expect(result).toBe(true);
  });

  it("should return true if document context is missing", async () => {
    const mockRule = {
      custom: vi.fn((validationCallback) => {
        return validationCallback;
      })
    };

    // @ts-expect-error mock rule
    const validator = isUrlUnique(mockRule, false, TEST_DOC_TYPE);

    // @ts-expect-error mock context
    const result = await validator(TEST_URL, {
      document: undefined
    });
    expect(result).toBe(true);
  });

  it("should return true if URL is unique", async () => {
    const mockFetch = vi.fn().mockResolvedValue(null);
    const mockClient = {
      fetch: mockFetch
    };
    const mockGetClient = vi.fn().mockReturnValue(mockClient);

    const mockRule = {
      custom: vi.fn((validationCallback) => {
        return validationCallback;
      })
    };

    // @ts-expect-error mock rule
    const validator = isUrlUnique(mockRule, false, TEST_DOC_TYPE);

    const context = {
      document: { _id: "drafts.123" },
      getClient: mockGetClient
    };

    // @ts-expect-error mock context
    const result = await validator(TEST_URL, context);

    expect(result).toBe(true);
    expect(mockGetClient).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalled();
  });

  it("should return warning string if URL is already used by another document", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValue({ _id: "456", name: "Other Doc" });
    const mockClient = {
      fetch: mockFetch
    };
    const mockGetClient = vi.fn().mockReturnValue(mockClient);

    const mockRule = {
      custom: vi.fn((validationCallback) => {
        return validationCallback;
      })
    };

    // @ts-expect-error mock rule
    const validator = isUrlUnique(mockRule, false, TEST_DOC_TYPE);

    const context = {
      document: { _id: TEST_DOC_ID },
      getClient: mockGetClient
    };

    // @ts-expect-error mock context
    const result = await validator(TEST_URL, context);

    expect(result).toBe("URL already used by Other Doc");
  });
});
