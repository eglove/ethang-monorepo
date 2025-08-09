import { beforeEach, describe, expect, it, vi } from "vitest";

import { ShortUrl } from "./short-url.ts";

const getFunction = vi.fn();
const putFunction = vi.fn();
const deleteFunction = vi.fn();
const TEST_URL = "https://example.com";

describe("ShortUrl.create", () => {
  let shortUrl: ShortUrl;

  beforeEach(() => {
    vi.resetAllMocks();
    shortUrl = new ShortUrl(
      {
        // @ts-expect-error works for test
        url_shortener: {
          delete: deleteFunction,
          get: getFunction,
          put: putFunction,
        },
      },
      "http://localhost",
    );
  });

  it("should create new short url if it does not exist", async () => {
    putFunction.mockResolvedValueOnce("1234567");
    putFunction.mockResolvedValueOnce(TEST_URL);

    const result = await shortUrl.create(TEST_URL);

    expect(result).toHaveProperty("_links");
    expect(result).toHaveProperty("id");
  });

  it("should return errors if properties fail to create", async () => {
    putFunction.mockResolvedValueOnce(null);
    const result = await shortUrl.create(TEST_URL);

    expect(result).toStrictEqual({
      _status: 500,
      errors: [
        {
          message: "Failed to create short link.",
          path: ["url"],
        },
      ],
    });
  });

  it("should return error if database structure is incorrect", async () => {
    getFunction.mockResolvedValueOnce({
      json: () => {
        return { "invalid url": "invalid url" };
      },
    });

    const result = await shortUrl.create(TEST_URL);

    expect(result).toStrictEqual({
      _status: 500,
      errors: [
        {
          message: "Internal Server Error",
          path: ["url"],
        },
      ],
    });
  });

  it("should return existing url id if it already exists", async () => {
    getFunction.mockResolvedValueOnce({
      json: () => {
        return { [TEST_URL]: "1234567" };
      },
    });

    const result = await shortUrl.create(TEST_URL);

    expect(result).toStrictEqual({
      _links: {
        redirect: { href: TEST_URL },
        self: { href: "http://localhost/links/1234567" },
      },
      _status: 201,
      id: "1234567",
    });
  });
});

describe("ShortUrl.getById", () => {
  let shortUrl: ShortUrl;

  beforeEach(() => {
    vi.clearAllMocks();
    shortUrl = new ShortUrl(
      {
        // @ts-expect-error works for test
        url_shortener: {
          get: getFunction,
        },
      },
      "http://localhost",
    );
  });

  it("should return not found if url does not exist", async () => {
    const result = await shortUrl.getById("1234567");

    expect(result).toStrictEqual({
      _status: 404,
      errors: [
        {
          message: "Not Found",
          path: ["id"],
        },
      ],
    });
  });

  it("should return internal server error if data is malformed", async () => {
    getFunction.mockResolvedValueOnce({
      json: () => {
        return { "invalid url": "invalid url" };
      },
    });

    const result = await shortUrl.getById("1234567");

    expect(result).toStrictEqual({
      _status: 500,
      errors: [
        {
          message: "Internal Server Error",
          path: ["id"],
        },
      ],
    });
  });

  it("should return a success response", async () => {
    getFunction.mockResolvedValueOnce({
      json: () => {
        return { id: "1234567", url: TEST_URL };
      },
    });

    const result = await shortUrl.getById("1234567");

    expect(result).toStrictEqual({
      _links: {
        redirect: { href: TEST_URL },
        self: { href: "http://localhost/links/1234567" },
      },
      _status: 200,
      id: "1234567",
    });
  });
});
