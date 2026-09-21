import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL("blog/the-blowup-half/index.mdx", import.meta.url);

const featuredImagePath = new URL(
  "blog/the-blowup-half/images/featured.jpg",
  import.meta.url
);

const pubDate = "2026-09-21T12:00:00Z";

const requiredSnippets = [
  'slug: "the-blowup-half"',
  'title: "The Blowup Half"',
  'blogCategory: "Blog"',
  `pubDate: "${pubDate}"`,
  "description:",
  "featuredImage: ./images/featured.jpg",
  "Claude-Louis Navier",
  "1822",
  "George Stokes",
  "1845",
  String.raw`\frac{\partial u}{\partial t}`,
  String.raw`(u \cdot \nabla) u`,
  String.raw`\nu \nabla^2 u + f`,
  String.raw`\nabla \cdot u = 0`,
  "the spoon stirring the tea",
  "wants to blow up",
  "smooths gradients",
  "velocity field",
  "pressure per density",
  "incompressibility",
  String.raw`Re = UL/\nu`,
  "Osborne Reynolds",
  "pipe flow",
  "Honey",
  "Hawking-Penrose",
  "May 24, 2000",
  "Charles Fefferman",
  "(A)",
  "(B)",
  "(C)",
  "(D)",
  "periodic box",
  "not negations of each other",
  "all four could hold",
  "qualifying outlet",
  "two years",
  "does not accept submissions",
  "Perelman",
  "2002-03",
  "declined the prize in 2010",
  "Fields Medal",
  "Jean Leray",
  "1934",
  "turbulent solutions",
  "test functions",
  "Caffarelli-Kohn-Nirenberg",
  "1982",
  "parabolic 1D measure zero",
  "Escauriaza-Seregin-Šverák",
  "2003",
  "weak-$L^3$",
  "Terence Tao",
  "2014",
  "averaged",
  "arXiv:1402.0290",
  "fine structure",
  "1750s",
  "clockwork of vortices",
  "Diego Córdoba",
  "Luis Martínez-Zoroa",
  "Fan Zheng",
  "finite total energy",
  "Tristan Buckmaster",
  "Courant Institute",
  "Levent Alpöge",
  "Anthropic",
  "August 15, 2026",
  "3D Euler",
  "2D Boussinesq",
  "incompressible porous medium",
  "August 22",
  "the heroes of the story",
  "September 8, 2026",
  "165 pages",
  "Finite Time Blowup for Navier-Stokes",
  "no arXiv",
  "starts from rest",
  "unbounded velocity",
  "kinetic energy",
  "88 hours",
  "17 more hours",
  "GPT-6 Astra",
  "10,000 concurrent agents",
  "2.7 million messages",
  "130 billion output tokens",
  "4.9 million messages",
  "300 billion tokens",
  "Codex",
  "Sébastien Bubeck",
  "several million dollars",
  "Business Insider",
  "BBC",
  "Simon Willison",
  "wild core",
  String.raw`\tau^{1/2}`,
  String.raw`\tau^{1/2-h}`,
  String.raw`0 \lt h \lt 0.01`,
  String.raw`\tau^{-1/2-h}`,
  String.raw`\tau^{-1/2}`,
  "(T - t)^{-h}",
  "kinetic energy drops to zero",
  "mean square",
  "two pulse families",
  "background shear",
  "100 agents",
  "50 hours",
  "Konstantin Kakaes",
  "Martin Bridson",
  "deliberately unhurried",
  "still lists the problem as active",
  "does not intend to claim",
  "best part of 100 years",
  "about 90",
  "mid-2010s",
  "Alparslan",
  "axial scale",
  "September 19, 2025",
  "corporations would claim the credit",
  "Augustus Mirabilis",
  "de-identified",
  "Codex sessions",
  "went unanswered",
  "Why would you ruin your career?",
  "If you don't want me to be nice, then I don't have to be nice.",
  "not accusing anyone of anything",
  "AI slop. I am sorry for this",
  "Deep Blue-Kasparov",
  "throw Levent under the bus",
  "no specific user data was accessed",
  "categorically impossible",
  "past July 3rd",
  "Scientific American",
  "A Severe Misalignment of AI in Mathematics",
  "25 Fields Medalists",
  "severely misaligned",
  "42 Royal Society Fellows",
  "Sir Paul Nurse",
  "127",
  "Timothy Gowers",
  "pretty good",
  "not eligible",
  "effective description",
  "molecular scale",
  "stop holding",
  "```mermaid",
  "accTitle: The road to blowup",
  "accTitle: Fefferman's four scenarios",
  "accTitle: September 2025 to September 2026",
  "From Leray's weak solutions in 1934 to the claimed Navier-Stokes blowup in 2026.",
  "Fefferman's four alternatives: the claim covers (C) and (D), the blowup half; (A) and (B) stay open.",
  "Two programs on the same road, and the meeting where they collided.",
  "featuredImageAlt:"
] as const;

describe("The Blowup Half", () => {
  it("exists with the agreed metadata", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain('slug: "the-blowup-half"');
    expect(post).toContain('title: "The Blowup Half"');
    expect(post).toContain('blogCategory: "Blog"');
    expect(post).toContain(`pubDate: "${pubDate}"`);
    expect(post).toContain("description:");
  });

  it.each(requiredSnippets)("makes the claim %s", async (snippet) => {
    const post = await readFile(postPath, "utf8");

    expect(post).toContain(snippet);
  });

  it("renders exactly three mermaid diagrams", async () => {
    const post = await readFile(postPath, "utf8");

    expect(post.match(/```mermaid/gu) ?? []).toHaveLength(3);
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
