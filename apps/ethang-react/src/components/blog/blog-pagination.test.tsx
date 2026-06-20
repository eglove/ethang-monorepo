import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { BlogPagination } from "./blog-pagination.tsx";
import { blogStore } from "./blog-store.ts";

vi.mock("@ethang/store/use-store", () => {
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
  it("renders pagination buttons and handles clicks", () => {
    mockUseQuery.mockReturnValue({
      data: { maxPages: 3 },
      isPending: false,
      isPlaceholderData: false
    });

    vi.spyOn(blogStore, "decrementPage");
    vi.spyOn(blogStore, "incrementPage");
    vi.spyOn(blogStore, "setPage");

    render(<BlogPagination />);

    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();

    const nextButton = screen.getByText("›");
    fireEvent.click(nextButton);
    expect(blogStore.incrementPage).toHaveBeenCalled();

    const previousButton = screen.getByText("‹");
    fireEvent.click(previousButton);
    expect(blogStore.decrementPage).toHaveBeenCalled();

    const page2Button = screen.getByText("2");
    fireEvent.click(page2Button);
    expect(blogStore.setPage).toHaveBeenCalledWith(2);
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
});
