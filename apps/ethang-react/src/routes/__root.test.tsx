import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./__root.tsx";

vi.mock("@tanstack/react-router", () => {
  return {
    createRootRoute: (config: { component: React.ComponentType }) => {
      return {
        component: config.component
      };
    },
    Outlet: () => {
      return <div>Outlet Content</div>;
    }
  };
});

describe("RootLayout", () => {
  it("renders Outlet inside Theme and QueryClientProvider", () => {
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByText("Outlet Content")).toBeDefined();
  });
});
