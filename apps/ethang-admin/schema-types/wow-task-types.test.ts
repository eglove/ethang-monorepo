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
    const titleField = find(wowTaskType.fields, (field) => {
      return "title" === field.name;
    });
    expect(titleField).toBeDefined();

    const mockRule = {
      required: vi.fn().mockReturnThis()
    };

    (titleField as any).validation(mockRule);

    expect(mockRule.required).toHaveBeenCalled();
  });

  it("validates taskType is required", () => {
    const taskTypeField = find(wowTaskType.fields, (field) => {
      return "taskType" === field.name;
    });
    expect(taskTypeField).toBeDefined();

    const mockRule = {
      required: vi.fn().mockReturnThis()
    };

    (taskTypeField as any).validation(mockRule);

    expect(mockRule.required).toHaveBeenCalled();
  });

  describe("prepare preview method", () => {
    const prepare = wowTaskType.preview?.prepare;

    it("prepares weekly task labels correctly", () => {
      expect(prepare).toBeDefined();
      const result = prepare?.({ taskType: "weekly", title: "My Task" });
      expect(result).toEqual({ title: "Weekly - My Task" });
    });

    it("prepares daily task labels correctly", () => {
      expect(prepare).toBeDefined();
      const result = prepare?.({ taskType: "daily", title: "My Task" });
      expect(result).toEqual({ title: "Daily - My Task" });
    });

    it("prepares one-time task labels correctly", () => {
      expect(prepare).toBeDefined();
      const result = prepare?.({ taskType: "one-time", title: "My Task" });
      expect(result).toEqual({ title: "One Time - My Task" });
    });
  });
});
