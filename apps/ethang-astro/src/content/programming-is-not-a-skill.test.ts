import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL(
  "blog/programming-is-not-a-skill/index.mdx",
  import.meta.url
);

const featuredImagePath = new URL(
  "blog/programming-is-not-a-skill/images/featured.jpg",
  import.meta.url
);

const pubDate = "2026-10-26T12:00:00Z";

const requiredSnippets = [
  "programming is not a skill",
  "the first human operation to be replaced by the computer itself",
  "virtually eliminate coding and debugging",
  "originally intended to eliminate the need for skilled programmers altogether",
  "Application Development Without Programmers",
  "really a black art",
  "reduced by more than half, by simply being watched",
  "cheaply and incrementally build a test suite",
  "safely* and *quickly* in a *sustainable* way",
  "our intellectual powers are rather geared to master static relations",
  "a common vocabulary for design",
  "The Legibility of Programming",
  "convention over configuration",
  "## The manual labor hides the craft",
  "No Silver Bullet",
  "Eliminating Toil",
  "What Is Software Design?",
  "Software Craftsmanship Manifesto",
  "a timeout doesn't prove the payment failed",
  "In Search of an Understandable Consensus Algorithm",
  "designed to be easy to understand",
  "properly distributed using Raft",
  "RFC 6749",
  "The defense concedes the thesis while trying to refute it",
  "Knowing a programming language really well isn't a skill",
  "came in dead last of eight",
  "absolutely the least important thing",
  "seventy years because the legibility boundary made it look scarce",
  "## Checking the result means measuring it",
  "15-30% of defects found",
  "70% of its serious security bugs are memory safety problems",
  "76% of vulnerabilities in 2019 to 24% in 2024",
  "thousands of security vulnerabilities and stability bugs",
  "I never wrote or read a single line of its code",
  "reading the code is the weak instrument",
  "featuredImage: ./images/featured.jpg",
  'featuredImageAlt: "Abstract illustration of a ratchet: a glowing gear built from translucent layers of code, its lowest layers dissolving into light absorbed by the layers above, locked one-directional by a metal pawl, layers eliminated stay eliminated"',
  "import PostImage from \"../../../components/ui/PostImage.astro\"",
  "./images/abstraction-ratchet.svg"
];

describe("Programming Is Not a Skill", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "programming-is-not-a-skill"');
    expect(post).toContain('title: "Programming Is Not a Skill"');
    expect(post).toContain('blogCategory: "Engineering"');
    expect(post).toContain(`pubDate: "${pubDate}"`);
    expect(post).toContain("description:");
  });

  it.each(requiredSnippets)("makes the claim %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it("carries inline evidence for the history and interview claims", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain("https://softwarepreservation.computerhistory.org/FORTRAN/paper/p45-backus.pdf");
    expect(post).toContain("https://dl.acm.org/doi/10.1145/3368089.3409712");
    expect(post).toContain("https://onlinelibrary.wiley.com/doi/full/10.1111/ijsa.12263");
    expect(post).toContain("https://archive.org/details/applicationdevel00mart");
    expect(post).toContain("https://doi.org/10.1145/3639562");
    expect(post).toContain("https://doi.org/10.1017/s0020859003001305");
    expect(post).toContain("https://ethang.dev/blog/the-architecture-of-ethang-agent");
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