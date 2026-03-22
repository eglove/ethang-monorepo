import { describe, expect, it } from "vitest";

import type { NewsUpdateReturn } from "../sanity/get-news-and-events.ts";

import { renderNewsUpdate } from "../test-utils/render.tsx";

const TITLE = "Road Closure Notice";

const makeUpdate = (
  overrides: Partial<NewsUpdateReturn> = {},
): NewsUpdateReturn => ({
  _id: "n1",
  date: "2024-06-15",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  description: undefined as never,
  title: TITLE,
  ...overrides,
});

describe("NewsUpdate", () => {
  it("renders the news title", async () => {
    const html = await renderNewsUpdate(makeUpdate());
    expect(html).toContain(TITLE);
  });

  it("renders description text when provided", async () => {
    const description = {
      _key: "b1",
      _type: "block",
      children: [
        { _key: "s1", _type: "span", marks: [], text: "Important update" },
      ],
      markDefs: [],
      style: "normal",
    };
    const html = await renderNewsUpdate(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      makeUpdate({ description: description as never }),
    );
    expect(html).toContain("Important update");
  });

  it("renders without crashing when description is undefined", async () => {
    const html = await renderNewsUpdate(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      makeUpdate({ description: undefined as never }),
    );
    expect(html).toContain(TITLE);
  });
});
