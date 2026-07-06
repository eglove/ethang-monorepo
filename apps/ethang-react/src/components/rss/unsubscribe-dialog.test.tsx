import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnsubscribeDialog } from "./unsubscribe-dialog.tsx";

const FEED_TITLE = "Test Feed";

describe("UnsubscribeDialog", () => {
  let onClose: ReturnType<typeof vi.fn<() => void>>;
  let onConfirm: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(() => {
    onClose = vi.fn<() => void>();
    onConfirm = vi.fn<() => void>();
  });

  it("renders nothing visible when open is false", () => {
    render(
      <UnsubscribeDialog
        isOpen={false}
        isPending={false}
        onClose={onClose}
        onConfirm={onConfirm}
        feedTitle={FEED_TITLE}
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title and description when open is true", () => {
    render(
      <UnsubscribeDialog
        isOpen
        isPending={false}
        onClose={onClose}
        onConfirm={onConfirm}
        feedTitle={FEED_TITLE}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Unsubscribe from feed?")).toBeInTheDocument();
    expect(screen.getByText(FEED_TITLE)).toBeInTheDocument();
  });

  it("calls onConfirm when the confirm button is clicked", () => {
    render(
      <UnsubscribeDialog
        isOpen
        isPending={false}
        onClose={onClose}
        onConfirm={onConfirm}
        feedTitle={FEED_TITLE}
      />
    );

    fireEvent.click(screen.getByTestId("unsubscribe-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onConfirm when the cancel button is clicked", () => {
    render(
      <UnsubscribeDialog
        isOpen
        isPending={false}
        onClose={onClose}
        onConfirm={onConfirm}
        feedTitle={FEED_TITLE}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onClose when the cancel button is clicked (Radix Close triggers onOpenChange)", () => {
    render(
      <UnsubscribeDialog
        isOpen
        isPending={false}
        onClose={onClose}
        onConfirm={onConfirm}
        feedTitle={FEED_TITLE}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("disables both buttons while isPending is true", () => {
    render(
      <UnsubscribeDialog
        isOpen
        isPending
        onClose={onClose}
        onConfirm={onConfirm}
        feedTitle={FEED_TITLE}
      />
    );

    expect(screen.getByTestId("unsubscribe-confirm")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
