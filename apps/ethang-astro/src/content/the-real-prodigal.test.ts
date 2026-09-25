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

const postPath = new URL("blog/the-real-prodigal/index.mdx", import.meta.url);

const featuredImagePath = new URL(
  "blog/the-real-prodigal/images/featured.png",
  import.meta.url
);

const pubDate = "2026-09-28T12:00:00Z";

const requiredSnippets = [
  'slug: "the-real-prodigal"',
  'title: "The Real Prodigal"',
  'blogCategory: "Blog"',
  `pubDate: "${pubDate}"`,
  "description:",
  "featuredImage: ./images/featured.png",
  "featuredImageAlt:",
  "Luke 15:11-32",
  "the father and two sons",
  "Luuk van de Weghe",
  "Wes Huff",
  "The Real Prodigal was the FATHER",
  "tax collectors and sinners",
  "eats with them",
  "lost sheep",
  "lost coin",
  "two sons",
  "epiballon meros",
  "bios",
  "double share",
  "far country",
  "pigs",
  "hired servants",
  "esplanchnistho",
  "splagchnon",
  "guts",
  "runs",
  "robe",
  "ring",
  "shoes on his feet",
  "fattened calf",
  "honor and shame",
  "goat",
  "prostitutes",
  "dead, and is alive",
  "lost, and is found",
  "the older son never enters the feast on the page",
  "asotos",
  "extravagantly wasteful",
  "prodigal father",
  "Isaiah 6",
  "Suppose one of you",
  "grumbled",
  "Both sons fail in different directions",
  "Kenneth E. Bailey",
  "Stories with Intent",
  "For People Like Us",
  "There was a man who had two sons",
  "give me the share of property that is coming to me",
  "squandered his property in reckless living",
  "no one gave him anything",
  "came to himself",
  "ran and embraced him and kissed him",
  "Bring quickly the best robe",
  "this my son was dead, and is alive again",
  "heard music and dancing",
  "he was angry and refused to go in",
  "Look, these many years I have served you",
  "you never gave me a young goat",
  "devoured your property with prostitutes",
  "came out and entreated him",
  "never disobeyed your command"
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

const isProseParagraph = (block: string) => {
  return (
    !block.startsWith("#") &&
    !block.startsWith("-") &&
    !block.startsWith(">") &&
    !block.startsWith("<") &&
    !/^\d+\./u.test(block)
  );
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

describe("The Real Prodigal", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "the-real-prodigal"');
    expect(post).toContain('title: "The Real Prodigal"');
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

  it("pairs each passage with its citation in the Blockquote component", async () => {
    const post = await readFile(postPath, "utf8");
    const passages = [
      "Luke 15:11-12",
      "Luke 15:13-16",
      "Luke 15:17-19",
      "Luke 15:20-21",
      "Luke 15:22-24",
      "Luke 15:25-28",
      "Luke 15:28-30",
      "Luke 15:31-32"
    ];

    expect(post).toContain(
      'import Blockquote from "../../../components/ui/Blockquote.astro";'
    );
    map(passages, (passage) => {
      expect(post).toContain('<Blockquote source="' + passage + '">');
    });
    expect(size(post.match(/<\/Blockquote>/gu))).toBe(8);
    expect(post).not.toMatch(/\*Luke 15:/u);
  });

  it("spends no em dashes in prose", async () => {
    const post = await readFile(postPath, "utf8");
    const body = replace(post, /^---[\s\S]*?---\s*/u, "");

    expect(body).not.toMatch(/[\u2014]|--/u);
  });
});

describe("The Real Prodigal reading comfort", () => {
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
