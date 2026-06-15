/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { fireEvent, render, screen } from "@testing-library/react";
import repeat from "lodash/repeat.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AddFeedForm } from "./add-feed-form.tsx";

const mockAddSubscription = vi.fn();
let mockLoading = false;

const FEED_XML_URL_PLACEHOLDER = "Feed XML URL";
const SCOPE_FORM = ":scope form";

vi.mock("@apollo/client/react", () => {
  return {
    useMutation: () => {
      return [mockAddSubscription, { loading: mockLoading }];
    }
  };
});

describe("AddFeedForm", () => {
  beforeEach(() => {
    mockAddSubscription.mockClear();
    mockLoading = false;
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
      target: { value: "https://example.com/rss.xml" }
    });
    fireEvent.click(button);

    expect(mockAddSubscription).toHaveBeenCalledWith({
      refetchQueries: [{ query: expect.any(Object) }],
      variables: { xmlAddress: "https://example.com/rss.xml" }
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
