import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HybridLink } from "./hybrid-link.tsx";

// Mock the TanStack Router Link component
vi.mock("@tanstack/react-router", () => {
  return {
    Link: ({ children, to }: { children: ReactNode; to: string }) => {
      return (
        <a href={to} data-testid="router-link">
          {children}
        </a>
      );
    }
  };
});

describe("HybridLink", () => {
  it("renders InternalLink for a relative URL path", () => {
    render(<HybridLink href="/relative-path">Internal Path</HybridLink>);

    const link = screen.getByRole("link", { name: "Internal Path" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/relative-path");
    expect(link.dataset["testid"]).toBe("router-link");
  });

  it("renders InternalLink for an absolute URL with the same origin", () => {
    vi.stubGlobal("location", {
      href: "http://localhost/home"
    });

    render(
      <HybridLink href="http://localhost/relative-path">
        Same Origin Link
      </HybridLink>
    );

    const link = screen.getByRole("link", { name: "Same Origin Link" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("http://localhost/relative-path");
    expect(link.dataset["testid"]).toBe("router-link");

    vi.unstubAllGlobals();
  });

  it("renders Radix Link with target _blank for a different origin", () => {
    vi.stubGlobal("location", {
      href: "http://localhost/home"
    });

    render(
      <HybridLink href="https://example.com/external-path">
        External Link
      </HybridLink>
    );

    const link = screen.getByRole("link", { name: "External Link" });
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("https://example.com/external-path");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.dataset["testid"]).toBeUndefined();

    vi.unstubAllGlobals();
  });
});
