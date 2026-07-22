import find from "lodash/find.js";
import { describe, expect, it, vi } from "vitest";

vi.mock("sanity", () => {
  return {
    defineField: (field: any) => {
      return field;
    },
    defineType: (schema: any) => {
      return schema;
    }
  };
});

vi.mock("@sanity/orderable-document-list", () => {
  return {
    orderRankField: (config: any) => {
      return { name: "orderRank", ...config };
    },
    orderRankOrdering: {}
  };
});

import { wowTaskType } from "./wow-task-types.ts";

describe("wowTaskType schema", () => {
  it("validates title is required", () => {
    const titleField = find(wowTaskType.fields, { name: "title" });
    expect(titleField).toBeDefined();

    const mockRule = {
      required: vi.fn().mockReturnThis()
    };

    (titleField as any).validation(mockRule);

    expect(mockRule.required).toHaveBeenCalled();
  });

  it("validates taskType is required", () => {
    const taskTypeField = find(wowTaskType.fields, { name: "taskType" });
    expect(taskTypeField).toBeDefined();

    const mockRule = {
      required: vi.fn().mockReturnThis()
    };

    (taskTypeField as any).validation(mockRule);

    expect(mockRule.required).toHaveBeenCalled();
  });

  describe("prepare preview method", () => {
    const prepare = wowTaskType.preview?.prepare;

    it.each([
      [{ taskType: "weekly", title: "My Task" }, { title: "Weekly - My Task" }],
      [{ taskType: "daily", title: "My Task" }, { title: "Daily - My Task" }],
      [
        { taskType: "one-time", title: "My Task" },
        { title: "One Time - My Task" }
      ]
    ])("prepares tasks labels correctly", (testCase, expected) => {
      expect(prepare).toBeDefined();
      const result = prepare?.(testCase);
      expect(result).toEqual(expected);
    });
  });
});
