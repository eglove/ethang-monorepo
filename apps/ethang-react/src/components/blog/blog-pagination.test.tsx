import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BlogPagination } from "./blog-pagination.tsx";
import { blogStoreActions } from "./blog-store.ts";

vi.mock("@ethang/store/use-store.ts", () => {
  return {
    useStore: vi.fn().mockImplementation((_store, selector) => {
      return selector({ paginationPage: 2 });
    })
  };
});

const mockUseQuery = vi.fn();
vi.mock("@tanstack/react-query", () => {
  return {
    keepPreviousData: {},
    useQuery: (queryKey: any) => {
      return mockUseQuery(queryKey);
    }
  };
});

vi.mock("@radix-ui/themes", () => {
  return {
    Button: ({ children, disabled, onClick, variant }: any) => {
      return (
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          data-variant={variant}
        >
          {children}
        </button>
      );
    },
    Flex: ({ children }: any) => {
      return <div>{children}</div>;
    }
  };
});

vi.mock("../../models/blog-model.ts", () => {
  return {
    getPaginatedBlogs: vi.fn()
  };
});

describe("BlogPagination", () => {
  it("renders pagination buttons and handles clicks", async () => {
    mockUseQuery.mockReturnValue({
      data: { maxPages: 3 },
      isPending: false,
      isPlaceholderData: false
    });

    const decrementSpy = vi
      .spyOn(blogStoreActions, "decrementPage")
      .mockResolvedValue({ paginationPage: 1 });
    const incrementSpy = vi
      .spyOn(blogStoreActions, "incrementPage")
      .mockResolvedValue({ paginationPage: 1 });
    const setPageSpy = vi
      .spyOn(blogStoreActions, "setPage")
      .mockResolvedValue({ paginationPage: 1 });

    render(<BlogPagination />);

    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();

    const nextButton = screen.getByText("›");
    fireEvent.click(nextButton);
    await vi.waitFor(() => {
      expect(incrementSpy).toHaveBeenCalled();
    });

    const previousButton = screen.getByText("‹");
    fireEvent.click(previousButton);
    await vi.waitFor(() => {
      expect(decrementSpy).toHaveBeenCalled();
    });

    const page2Button = screen.getByText("2");
    fireEvent.click(page2Button);
    await vi.waitFor(() => {
      expect(setPageSpy).toHaveBeenCalledWith(2);
    });
  });

  it("disables buttons when loading", () => {
    mockUseQuery.mockReturnValue({
      data: { maxPages: 3 },
      isPending: true,
      isPlaceholderData: false
    });

    render(<BlogPagination />);
    expect(screen.getByText("1")).toBeDisabled();
    expect(screen.getByText("‹")).toBeDisabled();
    expect(screen.getByText("›")).toBeDisabled();
  });

  it("falls back to a single page when no maxPages is reported", () => {
    mockUseQuery.mockReturnValue({
      data: null,
      isPending: false,
      isPlaceholderData: false
    });

    render(<BlogPagination />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("‹")).toBeDefined();
    expect(screen.getByText("›")).toBeDefined();
  });
});
