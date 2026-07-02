import find from "lodash/find.js";
import { describe, expect, it } from "vitest";

import { videoEmbedType } from "./video-embed-type.ts";

describe("videoEmbedType schema", () => {
  it("defines an object schema named videoEmbed", () => {
    expect(videoEmbedType.name).toBe("videoEmbed");
    expect(videoEmbedType.type).toBe("object");
    expect(videoEmbedType.title).toBe("Video Embed");
  });

  it.each(["videoId", "url", "title", "source"])(
    "exposes the %s field",
    (fieldName) => {
      const field = find(videoEmbedType.fields, (candidate) => {
        return candidate.name === fieldName;
      });
      expect(field).toBeDefined();
    }
  );

  it("exposes YouTube as a source option", () => {
    const sourceField = find(videoEmbedType.fields, (candidate) => {
      return "source" === candidate.name;
    }) as { options: { list: { title: string; value: string }[] } };

    expect(sourceField.options.list[0]).toEqual({
      title: "YouTube",
      value: "youtube"
    });
  });
});
