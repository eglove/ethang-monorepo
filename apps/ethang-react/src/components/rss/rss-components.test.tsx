import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NoSubscriptionsFound } from "./no-subscriptions-found.tsx";
import { NoUnreadArticles } from "./no-unread-articles.tsx";
import { RssContainer } from "./rss-container.tsx";

vi.mock("./articles.tsx", () => {
  return {
    Articles: () => {
      return <div>Mocked Articles</div>;
    }
  };
});

describe("RSS Components", () => {
  describe("NoSubscriptionsFound", () => {
    it("renders no subscriptions text", () => {
      render(<NoSubscriptionsFound />);
      expect(screen.getByText("No subscriptions found.")).toBeDefined();
    });
  });

  describe("NoUnreadArticles", () => {
    it("renders no unread articles text", () => {
      render(<NoUnreadArticles />);
      expect(screen.getByText("No unread articles.")).toBeDefined();
    });
  });

  describe("RssContainer", () => {
    it("renders heading and articles child component", () => {
      render(<RssContainer />);
      expect(screen.getByRole("heading", { name: "Articles" })).toBeDefined();
      expect(screen.getByText("Mocked Articles")).toBeDefined();
    });
  });
});
