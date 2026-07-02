import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import { blockContentType } from "./block-content-type.ts";

describe("blockContentType schema", () => {
  it("defines an array schema named blockContent", () => {
    expect(blockContentType.name).toBe("blockContent");
    expect(blockContentType.type).toBe("array");
    expect(blockContentType.title).toBe("Block Content");
  });

  it("includes a primary block type with link annotations and decorators", () => {
    const [blockEntry] = blockContentType.of as [
      {
        lists: { title: string; value: string }[];
        marks: {
          annotations: { name: string; type: string }[];
          decorators: { title: string; value: string }[];
        };
        styles: { title: string; value: string }[];
        type: string;
      }
    ];

    expect(blockEntry.type).toBe("block");
    expect(blockEntry.lists[0]).toEqual({ title: "Bullet", value: "bullet" });

    const [linkAnnotation] = blockEntry.marks.annotations;
    expect(linkAnnotation).toBeDefined();
    if (!linkAnnotation) {
      throw new Error("linkAnnotation should be defined");
    }
    expect(linkAnnotation.name).toBe("link");
    expect(linkAnnotation.type).toBe("object");

    const decoratorValues = map(blockEntry.marks.decorators, "value");
    expect(decoratorValues).toContain("strong");
    expect(decoratorValues).toContain("em");
    expect(decoratorValues).toContain("code");

    const styleValues = map(blockEntry.styles, "value");
    expect(styleValues).toContain("normal");
    expect(styleValues).toContain("h1");
    expect(styleValues).toContain("blockquote");
  });

  it("includes an image entry with required alt and optional caption", () => {
    const [, imageEntry] = blockContentType.of as [
      unknown,
      {
        fields: {
          name: string;
          type: string;
          validation?: (r: unknown) => unknown;
        }[];
        options: { hotspot: boolean };
        type: string;
      }
    ];

    expect(imageEntry.type).toBe("image");
    expect(imageEntry.options.hotspot).toBe(true);

    const [altField, captionField] = imageEntry.fields;
    expect(altField).toBeDefined();
    expect(captionField).toBeDefined();
    if (!altField || !captionField) {
      throw new Error("alt and caption fields should be defined");
    }
    expect(altField.name).toBe("alt");
    expect(altField.validation).toBeDefined();
    expect(captionField.name).toBe("caption");
    expect(captionField.validation).toBeUndefined();
  });

  it("includes embedded types for quote, code, and video", () => {
    const embedded = blockContentType.of.slice(2) as [
      { name: string; type: string },
      { name: string; type: string },
      { name: string; type: string }
    ];
    const [quoteField, codeField, videoField] = embedded;

    expect(quoteField.name).toBe("quote");
    expect(quoteField.type).toBe("blockquote");
    expect(codeField.name).toBe("code");
    expect(codeField.type).toBe("code");
    expect(videoField.name).toBe("video");
    expect(videoField.type).toBe("videoEmbed");
  });
});
