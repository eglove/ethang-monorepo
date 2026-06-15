/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return */
import find from "lodash/find.js";
import { describe, expect, it, vi } from "vitest";

import schema from "./news-update.ts";

vi.mock("sanity", () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    defineType: (schema: unknown) => {
      return schema;
    }
  };
});

const DATE = "2026-06-15";

describe("newsUpdate schema", () => {
  it("validates title field is required", () => {
    const titleField = find(schema.fields, (field) => {
      return "title" === field.name;
    });
    expect(titleField).toBeDefined();

    const mockRule = {
      required: vi.fn().mockReturnThis()
    };

    // @ts-expect-error mock rule
    titleField.validation(mockRule);

    expect(mockRule.required).toHaveBeenCalled();
  });

  it("sets initial value for date and validates it", () => {
    const dateField = find(schema.fields, (field) => {
      return "date" === field.name;
    });
    expect(dateField).toBeDefined();

    // @ts-expect-error for test
    const initial = dateField.initialValue();
    expect(initial.date).toBeDefined();

    const mockRule = {
      required: vi.fn().mockReturnThis()
    };

    // @ts-expect-error mock rule
    dateField.validation(mockRule);

    expect(mockRule.required).toHaveBeenCalled();
  });

  it("validates description field is required", () => {
    const descriptionField = find(schema.fields, (field) => {
      return "description" === field.name;
    });
    expect(descriptionField).toBeDefined();

    const mockRule = {
      required: vi.fn().mockReturnThis()
    };

    // @ts-expect-error mock rule
    descriptionField.validation(mockRule);

    expect(mockRule.required).toHaveBeenCalled();
  });

  describe("expireDate custom validation", () => {
    const expireDateField = find(schema.fields, (field) => {
      return "expireDate" === field.name;
    });

    const getValidator = () => {
      const mockRule = {
        custom: vi.fn((_function) => {
          return _function;
        })
      };

      // @ts-expect-error mock rule
      return expireDateField.validation(mockRule);
    };

    it("returns error if expireDate is undefined", async () => {
      const validator = getValidator();
      const result = await validator(undefined, { document: {} });
      expect(result).toBe("Value is required");
    });

    it("returns true if document context is undefined", async () => {
      const validator = getValidator();
      const result = await validator("2026-06-16", { document: undefined });
      expect(result).toBe(true);
    });

    it("returns error if expireDate is less than one day after start date", async () => {
      const validator = getValidator();
      const context = {
        document: {
          date: DATE
        }
      };
      const result = await validator(DATE, context);
      expect(result).toBe(
        "Expiration date must be at least one day after the date"
      );
    });

    it("returns true if expireDate is at least one day after start date", async () => {
      const validator = getValidator();
      const context = {
        document: {
          date: DATE
        }
      };
      const result = await validator("2026-06-16", context);
      expect(result).toBe(true);
    });
  });
});
