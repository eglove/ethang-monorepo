import { describe, expect, it } from "vitest";

import { rewriteServiceBindingImports } from "./rpc-typegen.ts";

const GENERATED_ENV_BLOCK = [
  "interface __BaseEnv_Env {",
  "\tjobResumes: R2Bucket;",
  "\tASSETS: Fetcher;",
  '\tethang_courses: Service<typeof import("../ethang-courses/src/index").default>;',
  '\tethang_rss: Service<typeof import("../ethang-rss/src/index").default>;',
  '\tjob_applications: Service<typeof import("../job-applications/src/index").default>;',
  "}"
].join("\n");

const REWRITTEN_ENV_BLOCK = [
  "interface __BaseEnv_Env {",
  "\tjobResumes: R2Bucket;",
  "\tASSETS: Fetcher;",
  '\tethang_courses: Service<typeof import("../ethang-courses/dist-types/index").default>;',
  '\tethang_rss: Service<typeof import("../ethang-rss/dist-types/index").default>;',
  '\tjob_applications: Service<typeof import("../job-applications/dist-types/index").default>;',
  "}"
].join("\n");

describe("rewriteServiceBindingImports", () => {
  it.each([
    {
      case: "ethang-courses binding",
      content:
        'ethang_courses: Service<typeof import("../ethang-courses/src/index").default>;',
      expected:
        'ethang_courses: Service<typeof import("../ethang-courses/dist-types/index").default>;'
    },
    {
      case: "ethang-rss binding",
      content:
        'ethang_rss: Service<typeof import("../ethang-rss/src/index").default>;',
      expected:
        'ethang_rss: Service<typeof import("../ethang-rss/dist-types/index").default>;'
    },
    {
      case: "job-applications binding",
      content:
        'job_applications: Service<typeof import("../job-applications/src/index").default>;',
      expected:
        'job_applications: Service<typeof import("../job-applications/dist-types/index").default>;'
    }
  ])("rewrites $case to emitted declarations", ({ content, expected }) => {
    expect(rewriteServiceBindingImports(content)).toBe(expected);
  });

  it.each([
    { case: "untyped binding", content: "ethang_rss: Fetcher;" },
    {
      case: "non-entrypoint sibling subpath",
      content: 'typeof import("../ethang-rss/src/cron/workflow")'
    },
    { case: "local import", content: 'typeof import("./local")' },
    { case: "package import", content: 'typeof import("effect")' },
    { case: "empty content", content: "" }
  ])("leaves $case unchanged", ({ content }) => {
    expect(rewriteServiceBindingImports(content)).toBe(content);
  });

  it("rewrites every binding in a generated Env block", () => {
    expect(rewriteServiceBindingImports(GENERATED_ENV_BLOCK)).toBe(
      REWRITTEN_ENV_BLOCK
    );
  });

  it("is idempotent", () => {
    const rewritten = rewriteServiceBindingImports(GENERATED_ENV_BLOCK);
    expect(rewriteServiceBindingImports(rewritten)).toBe(rewritten);
  });
});
