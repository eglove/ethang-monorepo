import type { ChangeEvent, SubmitEvent } from "react";

import { act, renderHook } from "@testing-library/react";
import noop from "lodash/noop.js";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { useForm } from "./use-form.js";

describe("useForm basic actions", () => {
  it("should initialize form state correctly", () => {
    const { result } = renderHook(() => {
      return useForm({
        age: 30,
        email: undefined,
        name: "Alice"
      });
    });

    expect(result.current.formState.name).toBe("Alice");
    expect(result.current.formState.age).toBe(30);
    expect(result.current.formState.email).toBe("");
  });

  it("should clear form fields to empty strings", () => {
    const { result } = renderHook(() => {
      return useForm({
        age: 30,
        name: "Alice"
      });
    });

    act(() => {
      result.current.clearForm();
    });

    expect(result.current.formState.name).toBe("");
    expect(result.current.formState.age).toBe("");
  });

  it("should reset form state to initial state", () => {
    const { result } = renderHook(() => {
      return useForm({
        age: 30,
        name: "Alice"
      });
    });

    act(() => {
      result.current.setValue("name")("Bob");
      result.current.setValue("age")(40);
    });

    expect(result.current.formState.name).toBe("Bob");
    expect(result.current.formState.age).toBe(40);

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formState.name).toBe("Alice");
    expect(result.current.formState.age).toBe(30);
  });
});

describe("useForm event handling", () => {
  it("should handle text input changes", () => {
    const onChangeSpy = vi.fn(noop);
    const { result } = renderHook(() => {
      return useForm({ name: "Alice" }, { onChange: onChangeSpy });
    });

    const mockEvent = {
      target: {
        files: [],
        name: "name",
        type: "text",
        value: "Bob"
      }
    };

    act(() => {
      result.current.handleChange(
        mockEvent as unknown as ChangeEvent<HTMLInputElement>
      );
    });

    expect(result.current.formState.name).toBe("Bob");
    expect(onChangeSpy).toHaveBeenCalledWith(mockEvent);
  });

  it("should handle checkbox changes", () => {
    const { result } = renderHook(() => {
      return useForm({ isAdmin: false });
    });

    const mockEvent = {
      target: {
        checked: true,
        files: [],
        name: "isAdmin",
        type: "checkbox",
        value: ""
      }
    };

    act(() => {
      result.current.handleChange(
        mockEvent as unknown as ChangeEvent<HTMLInputElement>
      );
    });

    expect(result.current.formState.isAdmin).toBe(true);
  });

  it("should handle number input changes by removing commas", () => {
    const { result } = renderHook(() => {
      return useForm({ amount: 0 });
    });

    const mockEvent = {
      target: {
        files: [],
        name: "amount",
        type: "number",
        value: "1,234"
      }
    };

    act(() => {
      result.current.handleChange(
        mockEvent as unknown as ChangeEvent<HTMLInputElement>
      );
    });

    expect(result.current.formState.amount).toBe(1234);
  });

  it("should handle file input changes", () => {
    const { result } = renderHook(() => {
      return useForm({ avatar: null as File | null });
    });

    const mockFile = new File(["test"], "avatar.png", { type: "image/png" });
    const mockEvent = {
      target: {
        files: [mockFile],
        name: "avatar",
        type: "file",
        value: ""
      }
    };

    act(() => {
      result.current.handleChange(
        mockEvent as unknown as ChangeEvent<HTMLInputElement>
      );
    });

    expect(result.current.formState.avatar).toBe(mockFile);
  });
});

describe("useForm validation and submission", () => {
  it("should validate form state successfully without validator", () => {
    const { result } = renderHook(() => {
      return useForm({ name: "Alice" });
    });

    let isValid = false;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(true);
  });

  it("should validate form state using zodValidator", () => {
    const schema = z.object({
      name: z.string().min(3)
    });

    const { result } = renderHook(() => {
      return useForm({ name: "Al" }, { zodValidator: schema });
    });

    let isValid = false;
    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(false);
    expect(result.current.formError).toBeDefined();

    act(() => {
      result.current.setValue("name")("Alice");
    });

    act(() => {
      isValid = result.current.validate();
    });

    expect(isValid).toBe(true);
  });

  it("should handle form submission success path", () => {
    const onSubmitSpy = vi.fn(noop);
    const preventDefaultSpy = vi.fn(noop);

    const { result } = renderHook(() => {
      return useForm({ name: "Alice" }, { onSubmit: onSubmitSpy });
    });

    const mockEvent = {
      preventDefault: preventDefaultSpy
    };

    act(() => {
      result.current.handleSubmit(
        mockEvent as unknown as SubmitEvent<HTMLFormElement>
      );
    });

    expect(preventDefaultSpy).toHaveBeenCalledWith();
    expect(onSubmitSpy).toHaveBeenCalledWith();
    expect(result.current.formError).toBe("");
  });

  it("should handle form submission when validation fails", () => {
    const schema = z.object({
      name: z.string().min(5)
    });
    const onSubmitSpy = vi.fn(noop);
    const preventDefaultSpy = vi.fn(noop);

    const { result } = renderHook(() => {
      return useForm(
        { name: "Al" },
        { onSubmit: onSubmitSpy, zodValidator: schema }
      );
    });

    const mockEvent = {
      preventDefault: preventDefaultSpy
    };

    act(() => {
      result.current.handleSubmit(
        mockEvent as unknown as SubmitEvent<HTMLFormElement>
      );
    });

    expect(preventDefaultSpy).toHaveBeenCalledWith();
    expect(onSubmitSpy).not.toHaveBeenCalled();
    expect(result.current.formError).toBeDefined();
  });

  it("should do nothing on submit if onSubmit is not provided", () => {
    const preventDefaultSpy = vi.fn(noop);
    const { result } = renderHook(() => {
      return useForm({ name: "Alice" });
    });

    const mockEvent = {
      preventDefault: preventDefaultSpy
    };

    expect(() => {
      act(() => {
        result.current.handleSubmit(
          mockEvent as unknown as SubmitEvent<HTMLFormElement>
        );
      });
    }).not.toThrow();

    expect(preventDefaultSpy).toHaveBeenCalledWith();
  });

  it("should handle form submission errors", () => {
    const onSubmitSpy = vi.fn(() => {
      throw new Error("Submission failed");
    });
    const onErrorSpy = vi.fn(noop);
    const preventDefaultSpy = vi.fn(noop);

    const { result } = renderHook(() => {
      return useForm(
        { name: "Alice" },
        { onError: onErrorSpy, onSubmit: onSubmitSpy }
      );
    });

    const mockEvent = {
      preventDefault: preventDefaultSpy
    };

    act(() => {
      result.current.handleSubmit(
        mockEvent as unknown as SubmitEvent<HTMLFormElement>
      );
    });

    expect(preventDefaultSpy).toHaveBeenCalledWith();
    expect(onSubmitSpy).toHaveBeenCalledWith();
    expect(onErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.formError).toBe("Submission failed");
  });
});
