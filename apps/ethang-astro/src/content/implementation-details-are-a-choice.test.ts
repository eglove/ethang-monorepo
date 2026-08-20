import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const postPath = new URL(
  "blog/implementation-details-are-a-choice/index.mdx",
  import.meta.url,
);
const publicDiagramPaths = {
  generationsSvg: new URL(
    "../../public/images/blog/implementation-details-are-a-choice/three-generations.svg",
    import.meta.url,
  ),
  pipelineSvg: new URL(
    "../../public/images/blog/implementation-details-are-a-choice/proof-pipeline.svg",
    import.meta.url,
  ),
};
const diagramPaths = {
  generationsPuml: new URL(
    "blog/implementation-details-are-a-choice/images/three-generations.puml",
    import.meta.url,
  ),
  generationsSvg: new URL(
    "blog/implementation-details-are-a-choice/images/three-generations.svg",
    import.meta.url,
  ),
  pipelinePuml: new URL(
    "blog/implementation-details-are-a-choice/images/proof-pipeline.puml",
    import.meta.url,
  ),
  pipelineSvg: new URL(
    "blog/implementation-details-are-a-choice/images/proof-pipeline.svg",
    import.meta.url,
  ),
};

describe("Implementation Details Are a Choice blog post", () => {
  it("exists with the agreed metadata and argument structure", async () => {
    const [
      post,
      pipelinePuml,
      pipelineSvg,
      publicPipelineSvg,
      generationsPuml,
      generationsSvg,
      publicGenerationsSvg,
    ] = await Promise.all([
      readFile(postPath, "utf8"),
      readFile(diagramPaths.pipelinePuml, "utf8"),
      readFile(diagramPaths.pipelineSvg, "utf8"),
      readFile(publicDiagramPaths.pipelineSvg, "utf8"),
      readFile(diagramPaths.generationsPuml, "utf8"),
      readFile(diagramPaths.generationsSvg, "utf8"),
      readFile(publicDiagramPaths.generationsSvg, "utf8"),
    ]);

    expect(post).toContain('slug: "implementation-details-are-a-choice"');
    expect(post).toContain('title: "Implementation Details Are a Choice"');
    expect(post).toContain("featuredImage: ./images/three-generations.svg");
    expect(post).toContain(
      'featuredImageAlt: "A diagram showing automated proof, continuous delivery, and AI-assisted implementation combining to support proven business behavior."',
    );
    expect(post).toContain(`pubDate: "2026-08-20T21:10:35Z"`);
    expect(post).toContain(`updatedDate: "2026-08-20T21:10:35Z"`);
    expect(post).toContain("First generation: prove the behavior");
    expect(post).toContain("Second generation: make proof continuous");
    expect(post).toContain(
      "Third generation: let AI produce inside the proof system",
    );
    expect(post).toContain("https://agilemanifesto.org/");
    expect(post).toContain(
      "https://martinfowler.com/articles/continuousIntegration.html",
    );
    expect(post).toContain(
      "https://dora.dev/capabilities/continuous-delivery/",
    );
    expect(post).toContain(
      "https://www.nist.gov/itl/csd/secure-systems-and-applications/source-code-security-analysis",
    );
    expect(post).toContain(
      "https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/",
    );
    expect(post).toContain("2026 meta-analysis");
    expect(post).toContain("26.08% increase in completed tasks");
    expect(post).toContain("24% more pull requests");
    expect(post).toContain("Three generations, one engineering system");
    expect(post).toContain("requirement → test → AI-assisted implementation");
    expect(post).toContain("cognitive complexity");
    expect(post).toContain("quality gate");
    expect(post).toContain("domain review");
    expect(post).toContain("production feedback");
    expect(post).toContain(
      "Static analysis cannot prove that the requirement is correct",
    );
    expect(post).toContain(
      "https://docs.sonarsource.com/sonarqube-server/2026.2/quality-standards-administration/managing-quality-gates/introduction-to-quality-gates",
    );
    expect(post).toContain("https://arxiv.org/html/2605.04779");
    expect(post).toContain("https://arxiv.org/html/2601.13597");
    expect(post).toContain("https://arxiv.org/html/2607.01418");
    expect(post).toContain(
      "![Three generations of engineering combine into proven business behavior](/images/blog/implementation-details-are-a-choice/three-generations.svg)",
    );
    expect(post).toContain(
      "![The proof pipeline from business requirement to production feedback](/images/blog/implementation-details-are-a-choice/proof-pipeline.svg)",
    );
    expect(publicGenerationsSvg).toBe(generationsSvg);
    expect(publicPipelineSvg).toBe(pipelineSvg);
    expect(generationsPuml).toContain("@startuml three-generations");
    expect(pipelinePuml).toContain("@startuml proof-pipeline");
    expect(generationsSvg).toContain('<title id="three-generations-title">');
    expect(generationsSvg).toContain('<desc id="three-generations-desc">');
    expect(pipelineSvg).toContain('<title id="pipeline-title">');
    expect(pipelineSvg).toContain('<desc id="pipeline-desc">');
  });
});
