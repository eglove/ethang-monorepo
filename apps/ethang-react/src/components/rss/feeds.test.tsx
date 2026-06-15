/* eslint-disable @typescript-eslint/unbound-method */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Feeds } from "./feeds.tsx";
import { rssStore } from "./rss-store.ts";

let mockQueryData: unknown = null;
let mockQueryLoading = false;
let mockSelectedFeedId: null | string = null;

const ALPHA_FEED_TITLE = "Alpha Feed";
const BETA_FEED_TITLE = "Beta Feed";

vi.mock("@apollo/client/react", () => {
  return {
    useQuery: () => {
      return { data: mockQueryData, loading: mockQueryLoading };
    }
  };
});

vi.mock("@ethang/store/use-store", () => {
  return {
    useStore: <T, U>(
      _store: T,
      selector: (state: { selectedFeedId: null | string }) => U
    ): U => {
      return selector({ selectedFeedId: mockSelectedFeedId });
    }
  };
});

vi.mock("./rss-store.ts", () => {
  return {
    rssStore: {
      setSelectedFeedId: vi.fn()
    }
  };
});

describe("Feeds", () => {
  beforeEach(() => {
    mockQueryData = null;
    mockQueryLoading = false;
    mockSelectedFeedId = null;
    vi.mocked(rssStore.setSelectedFeedId).mockClear();
  });

  it("renders a loading skeleton when loading and data is nil", () => {
    mockQueryLoading = true;
    render(<Feeds />);

    expect(screen.getByTestId("sidebar-skeleton")).toBeDefined();
  });

  it("renders sorted feeds when data is present", () => {
    mockQueryData = {
      subscriptions: {
        edges: [
          { node: { id: "feed-b", title: BETA_FEED_TITLE } },
          { node: { id: "feed-a", title: ALPHA_FEED_TITLE } }
        ]
      }
    };

    render(<Feeds />);

    expect(screen.getByRole("button", { name: "All Feeds" })).toBeDefined();

    const buttons = screen.getAllByRole("button");
    expect(buttons[1]?.textContent).toBe(ALPHA_FEED_TITLE);
    expect(buttons[2]?.textContent).toBe(BETA_FEED_TITLE);
  });

  it("calls setSelectedFeedId(null) when All Feeds is clicked", () => {
    mockQueryData = {
      subscriptions: {
        edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }]
      }
    };
    mockSelectedFeedId = "feed-a";

    render(<Feeds />);

    const allFeedsButton = screen.getByRole("button", { name: "All Feeds" });
    fireEvent.click(allFeedsButton);

    expect(rssStore.setSelectedFeedId).toHaveBeenCalledWith(null);
  });

  it("calls setSelectedFeedId(feed.id) when a feed button is clicked", () => {
    mockQueryData = {
      subscriptions: {
        edges: [{ node: { id: "feed-a", title: ALPHA_FEED_TITLE } }]
      }
    };

    render(<Feeds />);

    const feedButton = screen.getByRole("button", { name: ALPHA_FEED_TITLE });
    fireEvent.click(feedButton);

    expect(rssStore.setSelectedFeedId).toHaveBeenCalledWith("feed-a");
  });
});
