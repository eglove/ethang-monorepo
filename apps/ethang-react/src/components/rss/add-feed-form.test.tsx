import { fireEvent, render, screen } from "@testing-library/react";
import repeat from "lodash/repeat.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AddFeedForm,
  addSubscriptionMutationFunction,
  sanitizeFeedUrl
} from "./add-feed-form.tsx";

const mockAddSubscription = vi.fn().mockResolvedValue({});
const mockAddFeedFormStore = { isMockLoading: false };
const mockInvalidateQueries = vi.fn().mockResolvedValue({});

vi.mock("@tanstack/react-query", () => {
  return {
    useMutation: ({
      onSuccess
    }: {
      onSuccess?: () => Promise<void> | void;
    }) => {
      return {
        isPending: mockAddFeedFormStore.isMockLoading,
        mutateAsync: async (input: unknown) => {
          const result = await mockAddSubscription(input);
          if (onSuccess) {
            await onSuccess();
          }
          return result;
        }
      };
    },
    useQueryClient: () => {
      return {
        invalidateQueries: mockInvalidateQueries
      };
    }
  };
});

const FEED_XML_URL_PLACEHOLDER = "Feed XML URL";
const RSS_XML_URL = "https://example.com/rss.xml";
const RSS_XML_URL_WITH_PADDING = `  ${RSS_XML_URL}  `;
const SCOPE_FORM = ":scope form";
const INVALID_URL = "::::not-a-url::::";
const EMPTY_URL = "";

describe("addSubscriptionMutationFn", () => {
  it("calls rpcRequest with the correct arguments and returns the result", async () => {
    const mockResponse = { success: true };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(mockResponse, { status: 200 })
    );

    const result = await addSubscriptionMutationFunction({
      xmlAddress: RSS_XML_URL
    });

    expect(result).toEqual(mockResponse);
  });
});

describe("sanitizeFeedUrl", () => {
  it.each([
    { expected: null, input: EMPTY_URL },
    { expected: null, input: repeat(" ", 3) },
    { expected: null, input: INVALID_URL },
    { expected: RSS_XML_URL, input: RSS_XML_URL },
    { expected: RSS_XML_URL, input: RSS_XML_URL_WITH_PADDING }
  ])("returns $expected when given $input", ({ expected, input }) => {
    expect(sanitizeFeedUrl(input)).toBe(expected);
  });
});

describe("AddFeedForm", () => {
  beforeEach(() => {
    mockAddSubscription.mockClear();
    mockInvalidateQueries.mockClear();
    mockAddFeedFormStore.isMockLoading = false;
  });

  it("renders the form components", () => {
    render(<AddFeedForm />);

    const input = screen.getByPlaceholderText(FEED_XML_URL_PLACEHOLDER);
    const button = screen.getByRole("button", { name: "Add Feed" });

    expect(input).toBeDefined();
    expect(button).toBeDefined();
  });

  it("does not call addSubscription with an invalid URL on submit", () => {
    const { container } = render(<AddFeedForm />);

    const input = screen.getByPlaceholderText(FEED_XML_URL_PLACEHOLDER);
    fireEvent.change(input, { target: { value: "invalid-url" } });

    const form = container.querySelector(SCOPE_FORM);
    if (form) {
      fireEvent.submit(form);
    }

    expect(mockAddSubscription).not.toHaveBeenCalled();
  });

  it("does not call addSubscription when the URL cannot be parsed", () => {
    const { container } = render(<AddFeedForm />);

    const input = screen.getByPlaceholderText(FEED_XML_URL_PLACEHOLDER);
    fireEvent.change(input, { target: { value: INVALID_URL } });

    const form = container.querySelector(SCOPE_FORM);
    if (form) {
      fireEvent.submit(form);
    }

    expect(mockAddSubscription).not.toHaveBeenCalled();
  });

  it("does not call addSubscription with an empty URL", () => {
    const { container } = render(<AddFeedForm />);

    const form = container.querySelector(SCOPE_FORM);
    if (form) {
      fireEvent.submit(form);
    }

    expect(mockAddSubscription).not.toHaveBeenCalled();
  });

  it("does not call addSubscription with spaces only URL", () => {
    const { container } = render(<AddFeedForm />);

    const input = screen.getByPlaceholderText(FEED_XML_URL_PLACEHOLDER);
    fireEvent.change(input, { target: { value: repeat(" ", 3) } });

    const form = container.querySelector(SCOPE_FORM);
    if (form) {
      fireEvent.submit(form);
    }

    expect(mockAddSubscription).not.toHaveBeenCalled();
  });

  it("calls addSubscription with the sanitized URL when form is submitted", () => {
    const { container } = render(<AddFeedForm />);

    const input = screen.getByPlaceholderText(FEED_XML_URL_PLACEHOLDER);
    fireEvent.change(input, { target: { value: RSS_XML_URL } });

    const form = container.querySelector(SCOPE_FORM);
    if (form) {
      fireEvent.submit(form);
    }

    expect(mockAddSubscription).toHaveBeenCalledWith({
      xmlAddress: RSS_XML_URL
    });
  });
});
