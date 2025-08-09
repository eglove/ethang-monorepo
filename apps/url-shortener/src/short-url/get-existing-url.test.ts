import { beforeEach, describe, expect, it, vi } from "vitest";

import { getExistingUrl } from "./get-existing-url.ts"; // Update this path

describe("getExistingUrl", () => {
  const mockEnvironment = {
    url_shortener: {
      get: vi.fn(),
    },
  };

  const testUrl = "https://example.com";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the correct URL if it exists and the data is valid", async () => {
    const expectedShortenedUrl = "abcde12";
    const mockStorageObject = {
      json: vi.fn().mockResolvedValue({ [testUrl]: expectedShortenedUrl }),
    };

    mockEnvironment.url_shortener.get.mockResolvedValue(mockStorageObject);

    // @ts-expect-error minimal test object
    const result = await getExistingUrl(testUrl, mockEnvironment);

    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledTimes(1);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledWith(testUrl);
    expect(mockStorageObject.json).toHaveBeenCalledTimes(1);
    expect(result).toBe(expectedShortenedUrl);
  });

  it('should return "DOES_NOT_EXIST" if the URL is not found', async () => {
    mockEnvironment.url_shortener.get.mockResolvedValue(null);

    // @ts-expect-error minimal test object
    const result = await getExistingUrl(testUrl, mockEnvironment);

    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledTimes(1);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledWith(testUrl);
    expect(result).toBe("DOES_NOT_EXIST");
  });

  it('should return "FAILED_TO_PARSE" if the stored JSON is malformed', async () => {
    const mockStorageObject = {
      json: vi.fn().mockResolvedValue({ somethingElse: "invalid" }),
    };

    mockEnvironment.url_shortener.get.mockResolvedValue(mockStorageObject);

    // @ts-expect-error minimal test object
    const result = await getExistingUrl(testUrl, mockEnvironment);

    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledTimes(1);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledWith(testUrl);
    expect(mockStorageObject.json).toHaveBeenCalledTimes(1);
    expect(result).toBe("FAILED_TO_PARSE");
  });

  it('should return "FAILED_TO_PARSE" if the stored JSON is missing the key', async () => {
    const mockStorageObject = {
      json: vi.fn().mockResolvedValue({ someOtherKey: "someValue" }),
    };

    mockEnvironment.url_shortener.get.mockResolvedValue(mockStorageObject);

    // @ts-expect-error minimal test object
    const result = await getExistingUrl(testUrl, mockEnvironment);

    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledTimes(1);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledWith(testUrl);
    expect(mockStorageObject.json).toHaveBeenCalledTimes(1);
    expect(result).toBe("FAILED_TO_PARSE");
  });
});
