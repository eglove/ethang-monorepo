import { describe, expect, it } from "vitest";

import type { FileRecord } from "../sanity/get-files.ts";

import { renderFileTable } from "../test-utils/render.tsx";

const makeFile = (overrides: Partial<FileRecord> = {}): FileRecord =>
  ({
    _id: "file-1",
    category: "General",
    date: "2024-03-15T12:00:00.000Z",
    file: { asset: { url: "https://cdn.sanity.io/test.pdf" } },
    title: "Test Document",
    ...overrides,
  }) as FileRecord;

describe("fileTable", () => {
  it("renders the section title", async () => {
    const html = await renderFileTable([], "General");

    expect(html).toContain("General");
  });

  it("shows empty state when files array is empty", async () => {
    const html = await renderFileTable([], "General");

    expect(html).toContain("No files available.");
  });

  it("does not show empty state when files are present", async () => {
    const html = await renderFileTable([makeFile()], "General");

    expect(html).not.toContain("No files available.");
  });

  it("renders file title as a link", async () => {
    const html = await renderFileTable([makeFile()], "General");

    expect(html).toContain("Test Document");
    expect(html).toContain("https://cdn.sanity.io/test.pdf");
  });

  it("renders the formatted date", async () => {
    const html = await renderFileTable([makeFile()], "General");

    expect(html).toContain("Mar 15, 2024");
  });

  it("renders all files when multiple are provided", async () => {
    const files = [
      makeFile({ _id: "f1", title: "Doc One" }),
      makeFile({ _id: "f2", title: "Doc Two" }),
    ];
    const html = await renderFileTable(files, "General");

    expect(html).toContain("Doc One");
    expect(html).toContain("Doc Two");
  });

  it("opens file links in a new tab", async () => {
    const html = await renderFileTable([makeFile()], "General");

    expect(html).toContain('target="_blank"');
  });
});
