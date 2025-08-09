import { nanoid } from "nanoid";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createUniqueId } from "./create-unique-id.ts";

vi.mock("nanoid", () => {
  return {
    nanoid: vi.fn(),
  };
});

describe("createUniqueId", () => {
  const mockEnvironment = {
    url_shortener: {
      get: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a new unique ID if no collision occurs", async () => {
    const expectedId = "test123";
    vi.mocked(nanoid).mockReturnValue(expectedId);

    mockEnvironment.url_shortener.get.mockResolvedValue(null);

    // @ts-expect-error minimal test object
    const result = await createUniqueId(mockEnvironment);

    expect(nanoid).toHaveBeenCalledTimes(1);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledTimes(1);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledWith(expectedId);
    expect(result).toBe(expectedId);
  });

  it("should retry and return a new ID if a collision occurs", async () => {
    const collidingId = "collided";
    const successfulId = "uniqueId";

    vi.mocked(nanoid)
      .mockReturnValueOnce(collidingId)
      .mockReturnValueOnce(successfulId);

    mockEnvironment.url_shortener.get
      .mockResolvedValueOnce({ id: collidingId })
      .mockResolvedValueOnce(null);

    // @ts-expect-error minimal test object
    const result = await createUniqueId(mockEnvironment);

    expect(nanoid).toHaveBeenCalledTimes(2);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledTimes(2);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledWith(collidingId);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledWith(
      successfulId,
    );
    expect(result).toBe(successfulId);
  });

  it("should handle multiple consecutive collisions", async () => {
    const collidingId1 = "collide1";
    const collidingId2 = "collide2";
    const successfulId = "uniqueId";

    vi.mocked(nanoid)
      .mockReturnValueOnce(collidingId1)
      .mockReturnValueOnce(collidingId2)
      .mockReturnValueOnce(successfulId);

    mockEnvironment.url_shortener.get
      .mockResolvedValueOnce({ id: collidingId1 })
      .mockResolvedValueOnce({ id: collidingId2 })
      .mockResolvedValueOnce(null);

    // @ts-expect-error minimal test object
    const result = await createUniqueId(mockEnvironment);

    expect(nanoid).toHaveBeenCalledTimes(3);
    expect(mockEnvironment.url_shortener.get).toHaveBeenCalledTimes(3);
    expect(mockEnvironment.url_shortener.get).toHaveBeenNthCalledWith(
      1,
      collidingId1,
    );
    expect(mockEnvironment.url_shortener.get).toHaveBeenNthCalledWith(
      2,
      collidingId2,
    );
    expect(mockEnvironment.url_shortener.get).toHaveBeenNthCalledWith(
      3,
      successfulId,
    );
    expect(result).toBe(successfulId);
  });
});
