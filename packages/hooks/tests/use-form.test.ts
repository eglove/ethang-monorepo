import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import { useForm } from "../src/use-form.js";

vi.mock("zod", async (importOriginal) => {
  const actual = await importOriginal<typeof import("zod")>();
  return {
    ...actual,
    z: {
      ...actual.z,
      prettifyError: vi.fn().mockReturnValue("Validation failed"),
    },
    ZodError: class MockZodError extends Error {
      constructor() {
        super("Validation failed");
        this.name = "ZodError";
      }
    },
  };
});

describe("useForm", () => {
  it("should initialize with the provided state", () => {
    const { result } = renderHook(() => useForm({ age: 30, name: "John" }));
    expect(result.current.formState).toEqual({ age: 30, name: "John" });
  });

  it("should replace undefined with empty string in initial state", () => {
    const { result } = renderHook(() => useForm({ age: 30, name: undefined }));
    expect(result.current.formState).toEqual({ age: 30, name: "" });
  });

  it("should update form state on handleChange for text input", () => {
    const onChangeMock = vi.fn();
    const { result } = renderHook(() =>
      useForm({ name: "John" }, { onChange: onChangeMock })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "name", type: "text", value: "Doe" },
      } as any);
    });

    expect(result.current.formState).toEqual({ name: "Doe" });
    expect(onChangeMock).toHaveBeenCalled();
  });

  it("should handle checkbox changes", () => {
    const { result } = renderHook(() => useForm({ isChecked: false }));

    act(() => {
      result.current.handleChange({
        target: {
          checked: true,
          name: "isChecked",
          type: "checkbox",
        },
      } as any);
    });

    expect(result.current.formState).toEqual({ isChecked: true });
  });

  it("should handle number changes", () => {
    const { result } = renderHook(() => useForm({ amount: 0 }));

    act(() => {
      result.current.handleChange({
        target: {
          name: "amount",
          type: "number",
          value: "1,234.56",
        },
      } as any);
    });

    expect(result.current.formState).toEqual({ amount: 1234.56 });
  });

  it("should handle file inputs", () => {
    const { result } = renderHook(() => useForm({ file: null }));
    const mockFile = new File([""], "test.png", { type: "image/png" });

    act(() => {
      result.current.handleChange({
        target: {
          files: [mockFile],
          name: "file",
          type: "file",
        },
      } as any);
    });

    expect(result.current.formState.file).toBe(mockFile);
  });

  it("should clear the form", () => {
    const { result } = renderHook(() => useForm({ age: 30, name: "John" }));

    act(() => {
      result.current.clearForm();
    });

    expect(result.current.formState).toEqual({ age: "", name: "" });
  });

  it("should reset the form", () => {
    const { result } = renderHook(() => useForm({ age: 30, name: "John" }));

    act(() => {
      result.current.handleChange({
        target: { name: "name", type: "text", value: "Doe" },
      } as any);
    });

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formState).toEqual({ age: 30, name: "John" });
  });

  it("should manually set a value", () => {
    const { result } = renderHook(() => useForm({ name: "John" }));

    act(() => {
      result.current.setValue("name")("Jane");
    });

    expect(result.current.formState).toEqual({ name: "Jane" });
  });

  it("should validate and succeed if no validator is provided", () => {
    const { result } = renderHook(() => useForm({ name: "John" }));
    let isValid = false;

    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(true);
  });

  it("should set form error on validation failure", () => {
    const mockZodValidator = {
      safeParse: vi.fn().mockReturnValue({
        error: new ZodError([]),
        success: false,
      }),
    };

    const { result } = renderHook(() =>
      useForm({ name: "" }, { zodValidator: mockZodValidator as any })
    );

    act(() => {
      result.current.validate();
    });

    expect(result.current.formError).toEqual("Validation failed");
  });

  it("should handle form submission when validation fails", () => {
    const mockZodValidator = {
      safeParse: vi.fn().mockReturnValue({
        error: new ZodError([]),
        success: false,
      }),
    };
    const onSubmitMock = vi.fn();

    const { result } = renderHook(() =>
      useForm(
        { name: "" },
        { onSubmit: onSubmitMock, zodValidator: mockZodValidator as any }
      )
    );

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(onSubmitMock).not.toHaveBeenCalled();
    expect(result.current.formError).toEqual("Validation failed");
  });

  it("should handle form submission when no onSubmit is provided", () => {
    const { result } = renderHook(() => useForm({ name: "John" }));

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.formError).toBeUndefined();
  });

  it("should handle form submission when valid", () => {
    const onSubmitMock = vi.fn();
    const { result } = renderHook(() =>
      useForm({ name: "John" }, { onSubmit: onSubmitMock })
    );

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(onSubmitMock).toHaveBeenCalled();
    expect(result.current.formError).toEqual("");
  });

  it("should handle errors thrown during submit", () => {
    const onErrorMock = vi.fn();
    const mockError = new Error("Submit failed");
    const onSubmitMock = vi.fn().mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() =>
      useForm(
        { name: "John" },
        { onError: onErrorMock, onSubmit: onSubmitMock }
      )
    );

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(onErrorMock).toHaveBeenCalledWith(mockError);
    expect(result.current.formError).toEqual("Submit failed");
  });

  it("should validate and succeed when Zod validator is provided but succeeds", () => {
    const mockZodValidator = {
      safeParse: vi.fn().mockReturnValue({
        success: true,
      }),
    };

    const { result } = renderHook(() =>
      useForm({ name: "" }, { zodValidator: mockZodValidator as any })
    );

    let isValid = false;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(true);
  });

  it("should catch non-Error thrown during submit", () => {
    const onErrorMock = vi.fn();
    const mockError = "String error";
    const onSubmitMock = vi.fn().mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() =>
      useForm(
        { name: "John" },
        { onError: onErrorMock, onSubmit: onSubmitMock }
      )
    );

    act(() => {
      result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(onErrorMock).toHaveBeenCalledWith(mockError);
  });
});
