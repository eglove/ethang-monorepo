import { experimental_AstroContainer as AstroContainer } from "astro/container";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import reduce from "lodash/reduce.js";
import reject from "lodash/reject.js";
import split from "lodash/split.js";
import { describe, expect, it } from "vitest";

import { learnStages, stageEntries, totalEntryCount } from "../lib/learn.ts";
import Learn from "../pages/learn.astro";

/*
 * Astro escapes characters that are unsafe in HTML, so a title with an
 * apostrophe arrives as `&#39;`. Decode the entities the renderer emits so the
 * assertions compare text a reader would actually see.
 */
const ENTITIES: readonly (readonly [string, string])[] = [
  ["&quot;", '"'],
  ["&#39;", "'"],
  ["&lt;", "<"],
  ["&gt;", ">"],
  ["&amp;", "&"]
];

const decode = (html: string) => {
  return reduce(
    ENTITIES,
    (text, [entity, character]) => {
      return split(text, entity).join(character);
    },
    html
  );
};

const render = async () => {
  const container = await AstroContainer.create();
  return decode(await container.renderToString(Learn as never));
};

const entries = learnStages.flatMap((stage) => {
  return stageEntries(stage);
});

const linkedEntries = reject(entries, (entry) => {
  return isNil(entry.url);
});

describe("learn page", () => {
  it.each(["<title>Learn</title>", ">Learn<"])(
    "titles itself Learn: %s",
    async (marker) => {
      const html = await render();

      expect(html).toContain(marker);
    }
  );

  it("says what the page is for", async () => {
    const html = await render();

    expect(html).toContain("deciding what to build");
    expect(html).toContain("checking the result");
  });

  it("renders every stage as a heading with a jump target", async () => {
    const html = await render();

    for (const stage of learnStages) {
      expect(html).toContain(stage.title);
      expect(html).toContain(`#${stage.slug}`);
    }
  });

  it("gives every stage a done-when check", async () => {
    const html = await render();

    expect(html.match(/Done when/gu)).toHaveLength(learnStages.length);
    for (const stage of learnStages) {
      expect(html).toContain(stage.doneWhen);
    }
  });

  it.each(
    map(linkedEntries, (entry) => {
      return [entry.title, entry.url] as const;
    })
  )("links %s to its source", async (_title, url) => {
    const html = await render();

    expect(html).toContain(`href="${url}"`);
  });

  it("renders the title of every entry, linked or not", async () => {
    const html = await render();

    for (const entry of entries) {
      expect(html).toContain(entry.title);
    }
  });

  it("opens sources in a new tab without leaking the referrer", async () => {
    const html = await render();

    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it.each(["video", "paper", "corpus"])(
    "badges the %s format with an icon and its label",
    async (format) => {
      const html = await render();

      expect(html).toContain(format);
      /*
      The icon is decorative, so it stays out of the accessibility tree.
      */
      expect(html).toContain('aria-hidden="true"');
    }
  );

  it("reports how many entries there are", async () => {
    const html = await render();

    expect(html).toContain(String(totalEntryCount(learnStages)));
  });

  it.each([
    "The rule: what earns a place",
    "What to do when a stage has no good course",
    "Why each stage exists",
    "Where it is unverified",
    "Where the stages sit in SWEBOK",
    "METR, July 2025",
    "SysMoBench, 2025"
  ])("does not argue for the list: %s", async (heading) => {
    const html = await render();

    expect(html).not.toContain(heading);
  });
});
