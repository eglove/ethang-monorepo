import compact from "lodash/compact.js";
import every from "lodash/every.js";
import filter from "lodash/filter.js";
import flatMap from "lodash/flatMap.js";
import map from "lodash/map.js";
import replace from "lodash/replace.js";
import size from "lodash/size.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL("blog/graded-as-morals/index.mdx", import.meta.url);

const featuredImagePath = new URL(
  "blog/graded-as-morals/images/featured.png",
  import.meta.url
);

const pubDate = "2026-09-29T12:00:00Z";

const requiredSnippets = [
  'slug: "graded-as-morals"',
  'title: "Graded as Morals"',
  'blogCategory: "Blog"',
  `pubDate: "${pubDate}"`,
  "description:",
  "featuredImage: ./images/featured.png",
  "featuredImageAlt:",
  "where responsibility ends and discrimination begins",
  "the social contract",
  "accountability is not ableism",
  "Gregg Wallace",
  "Neil Gaiman",
  "half an hour",
  "four overlapping conversations",
  "graded as morals",
  "214",
  "10-second",
  "style, not substance",
  "awkwardness",
  "Morrison",
  "DeBrabander",
  "double empathy problem",
  "Crompton",
  "tone policing",
  "Orion Kelly",
  "Autistic people see kindness as honesty",
  "clarity is kindness",
  "Time blindness",
  "Metcalfe",
  "Casassus",
  "You're not marked safe until you're out the door",
  "lie about the start time",
  "executive-function",
  "10,000 steps",
  "neurodevelopmental",
  "Asasumasu",
  "a tool of inclusion",
  "Cassidy",
  "72%",
  "Newell",
  "Hirvikoski",
  "Santomauro",
  "CIPD",
  "one in five",
  "Connor Tomlinson",
  "individualism in a community costume",
  "don't expect anyone else to move",
  "centering yourself in the narrative",
  "rejection sensitive dysphoria",
  "would have let her ask for support",
  "Didion",
  "On Self-Respect",
  "Nobody is owed friendship",
  "you can't woke-scold someone into being your friend",
  "chronic people-pleasers",
  "wrong audience",
  "Kathleen Stock",
  "Zara Beth",
  "traveling is exhausting for everyone",
  "https://www.youtube.com/watch?v=KE0iALZS0as",
  "https://www.youtube.com/watch?v=wN8zt7ScrbY",
  "https://www.youtube.com/watch?v=CXhr-gyr5AI",
  "https://www.cipd.org/uk/knowledge/reports/neuroinclusion-at-work/",
  "https://stimpunks.org/glossary/neurodivergent/",
  "https://www.vogue.com/article/joan-didion-self-respect-essay-1961",
  "https://www.nature.com/articles/srep40700",
  "https://en.wikipedia.org/wiki/Connor_Tomlinson_(TV_personality)",
  "](/blog/the-barrier-is-rarely-the-work)"
] as const;

const bodyWithoutScaffolding = (post: string) => {
  return replace(
    replace(post, /^---[\s\S]*?---\s*/u, ""),
    /```[\s\S]*?```/gu,
    ""
  );
};

const blocksOf = (post: string) => {
  return compact(map(split(bodyWithoutScaffolding(post), /\n\s*\n/u), trim));
};

/* Headings, list items, blockquotes, JSX components, and ordered lists are
   scaffolding, not prose paragraphs. */
const nonProsePrefix = /^(?:[#><-]|\d+\.)/u;

const isProseParagraph = (block: string) => {
  return !nonProsePrefix.test(block);
};

const guardAbbreviations = (block: string) => {
  return replace(
    block,
    /(\b(?:H\.R\.|Rep\.|Sen\.|Mr\.|Ms\.|Mrs\.|Dr\.|St\.|Jan\.|Feb\.|Mar\.|Apr\.|Jun\.|Jul\.|Aug\.|Sept?\.|Oct\.|Nov\.|Dec\.)) /gu,
    "$1\u{E000}"
  );
};

const sentencesOf = (block: string) => {
  return compact(
    map(split(guardAbbreviations(block), /(?<=[.!?])\s+/u), (fragment) => {
      return replace(fragment, /\u{E000}/gu, " ");
    })
  );
};

const sentenceCount = (block: string) => {
  return size(sentencesOf(block));
};

const wordCount = (sentence: string) => {
  return size(split(trim(sentence), /\s+/u));
};

describe("Graded as Morals", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "graded-as-morals"');
    expect(post).toContain('title: "Graded as Morals"');
    expect(post).toContain('blogCategory: "Blog"');
    expect(post).toContain(`pubDate: "${pubDate}"`);
    expect(post).toContain("description:");
  });

  it.each(requiredSnippets)("makes the claim %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it("ships the featured image as a valid PNG", async () => {
    const image = await readFile(featuredImagePath);

    expect(image.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  });

  it("is public-safe: no local machine paths", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toContain(String.raw`C:\Users`);
    expect(post).not.toContain("personal-vault");
  });

  it("spends no em dashes in prose", async () => {
    const post = await readFile(postPath, "utf8");
    const body = replace(post, /^---[\s\S]*?---\s*/u, "");

    expect(body).not.toMatch(/\u{2014}|--/u);
  });
});

describe("Graded as Morals reading comfort", () => {
  it("keeps prose paragraphs to four sentences or fewer", async () => {
    const post = await readFile(postPath, "utf8");
    const longParagraphs = filter(
      filter(blocksOf(post), isProseParagraph),
      (block) => {
        return 4 < sentenceCount(block);
      }
    );

    expect(longParagraphs).toEqual([]);
  });

  it("keeps every sentence under forty words", async () => {
    const post = await readFile(postPath, "utf8");
    const longSentences = filter(
      flatMap(filter(blocksOf(post), isProseParagraph), sentencesOf),
      (sentence) => {
        return 40 < wordCount(sentence);
      }
    );

    expect(longSentences).toEqual([]);
  });

  it("varies sentence lengths: no paragraph runs only short sentences", async () => {
    const post = await readFile(postPath, "utf8");
    const punchyParagraphs = filter(
      filter(blocksOf(post), isProseParagraph),
      (block) => {
        const lengths = map(sentencesOf(block), wordCount);
        return (
          3 <= size(lengths) &&
          every(lengths, (length) => {
            return 14 >= length;
          })
        );
      }
    );

    expect(punchyParagraphs).toEqual([]);
  });
});
