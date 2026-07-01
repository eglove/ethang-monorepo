import { fireEvent, render, screen } from "@testing-library/react";
import repeat from "lodash/repeat.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AddFeedForm,
  addSubscriptionMutationFunction
} from "./add-feed-form.tsx";

const mockAddSubscription = vi.fn().mockResolvedValue({});
const mockAddFeedFormStore = { isMockLoading: false };
const mockInvalidateQueries = vi.fn().mockResolvedValue({});

vi.mock("@tanstack/react-query", () => {
  return {
    useMutation: () => {
      return {
        isPending: mockAddFeedFormStore.isMockLoading,
        mutateAsync: mockAddSubscription
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
const SCOPE_FORM = ":scope form";

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

  it("calls addSubscription with a valid URL on submit", () => {
    render(<AddFeedForm />);

    const input = screen.getByPlaceholderText(FEED_XML_URL_PLACEHOLDER);
    const button = screen.getByRole("button", { name: "Add Feed" });

    fireEvent.change(input, {
      target: { value: RSS_XML_URL }
    });
    fireEvent.click(button);

    expect(mockAddSubscription).toHaveBeenCalledWith({
      xmlAddress: RSS_XML_URL
    });
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
});
