import compact from "lodash/compact.js";
import filter from "lodash/filter.js";
import flatMap from "lodash/flatMap.js";
import map from "lodash/map.js";
import replace from "lodash/replace.js";
import size from "lodash/size.js";
import split from "lodash/split.js";
import trim from "lodash/trim.js";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL("blog/half-right/index.mdx", import.meta.url);

const featuredImagePath = new URL(
  "blog/half-right/images/featured.jpg",
  import.meta.url
);

const pubDate = "2026-09-21T18:00:00Z";

const requiredSnippets = [
  'slug: "half-right"',
  'title: "Half Right"',
  'blogCategory: "Blog"',
  `pubDate: "${pubDate}"`,
  "description:",
  "featuredImage: ./images/featured.jpg",
  "featuredImageAlt:",
  "September 17, 2026",
  "Jacob Hoffman-Andrews",
  "Tori Noble",
  "Maddie Daly",
  "Ground AI Cybersecurity Rules in Best Practices",
  "could have been mitigated or prevented by following longstanding cybersecurity best practices",
  "would have prevented or substantially mitigated all of the incidents at AI labs that we currently know about",
  "demonstrated risks",
  "doomsday",
  "mid-May",
  "zero-day",
  "package-registry cache proxy",
  "cybersecurity evaluations",
  "internal-only model",
  "message board",
  "700",
  "over a thousand",
  "July 16",
  "July 27",
  "Anatomy of a Frontier Lab Agent Intrusion",
  "August 26, 2026",
  "September 16",
  "intentionally disabled",
  "guardrails",
  "admission policy",
  "privileged pods",
  "cluster-admin",
  "metadata service",
  "failed to page",
  "The individual weaknesses were familiar",
  "A capable human attacker could have found and exploited the same flaws",
  "sandboxed",
  "disconnected from other systems",
  "monitored and logged",
  "third-party investigations",
  "obsolete",
  "breaking into someone else's computers",
  "high likelihood of harming third parties",
  "Ajeya Cotra",
  "losing battle",
  "Axios",
  "September 1",
  "scoped to the agents' behavior",
  "never assessed",
  "half right",
  "Anthropic",
  "July 30",
  "three incidents",
  "configuration and human error",
  "a simulation",
  "Meta",
  "August 5",
  "misconfiguration",
  "Moonshot",
  "Kimi K3",
  "disputed",
  "Opus 4.6",
  "single-sourced",
  "January 2026",
  "properly hardened environment",
  "known and unapplied",
  "machine speed",
  "Executive Order 14409",
  "June 2, 2026",
  "NSA",
  "FRONTIER Act",
  "H.R. 9925",
  "Obernolte",
  "Moran",
  "seven-day",
  "SB 53",
  "January 1, 2026",
  "15 days",
  "N-9-26",
  "kill switch",
  "72-hour",
  "November 2026",
  "hoax",
  "AI Force",
  "retaliation against protected speech",
  "bill summaries",
  "```mermaid",
  "accTitle: The 2026 lab incident record",
  "From the first probes in mid-May to EFF's proposal in mid-September.",
  "a misconfiguration or a switched-off guardrail",
  "a claim about the past"
] as const;

/*
 * Abbreviation dots (H.R., Rep., Sept.) are not sentence ends; pinning the
 * space behind them keeps the fragment counters honest.
 */
const NO_BREAK = "\u{E000}";

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
    !block.startsWith("<") &&
    !/^\d+\./u.test(block)
  );
};

const guardAbbreviations = (block: string) => {
  return replace(
    block,
    /(\b(?:H\.R\.|Rep\.|Sen\.|Mr\.|Ms\.|Mrs\.|Dr\.|Jan\.|Feb\.|Mar\.|Apr\.|Jun\.|Jul\.|Aug\.|Sept?\.|Oct\.|Nov\.|Dec\.)) /gu,
    `$1${NO_BREAK}`
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

describe("Half Right", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "half-right"');
    expect(post).toContain('title: "Half Right"');
    expect(post).toContain('blogCategory: "Blog"');
    expect(post).toContain(`pubDate: "${pubDate}"`);
    expect(post).toContain("description:");
  });

  it.each(requiredSnippets)("makes the claim %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it("renders exactly one mermaid diagram", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post.match(/```mermaid/gu) ?? []).toHaveLength(1);
  });

  it("ships the featured image as a valid JPEG", async () => {
    const image = await readFile(featuredImagePath);

    expect(image.subarray(0, 3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));
  });

  it("is public-safe: no local machine paths", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).not.toContain(String.raw`C:\Users`);
    expect(post).not.toContain("personal-vault");
  });
});

describe("Half Right reading comfort", () => {
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
      flatMap(blocksOf(post), sentencesOf),
      (sentence) => {
        return 40 < wordCount(sentence);
      }
    );

    expect(longSentences).toEqual([]);
  });

  it("presents the record and the policy sections as scannable labeled lists", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain("- **Anthropic, July 30:**");
    expect(post).toContain("- **Meta, August 5:**");
    expect(post).toContain("**Federal:**");
    expect(post).toContain("**California:**");
    expect(post).toContain("**New York:**");
  });
});
