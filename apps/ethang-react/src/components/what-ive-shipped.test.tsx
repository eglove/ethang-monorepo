import { render, screen } from "@testing-library/react";
import map from "lodash/map.js";
import { describe, expect, it } from "vitest";

import { WhatIveShipped } from "./what-ive-shipped.tsx";

describe("WhatIveShipped", () => {
  it("renders one card per project with a name and detail", () => {
    const { container } = render(<WhatIveShipped />);
    expect(container.querySelectorAll("[data-project]")).toHaveLength(18);
    expect(container.querySelectorAll("[data-name]")).toHaveLength(18);
  });

  it("renders the unstick note for projects that have one", () => {
    const { container } = render(<WhatIveShipped />);
    const unstickNodes = container.querySelectorAll("[data-unstick]");
    expect(unstickNodes.length).toBeGreaterThan(0);
  });

  it("uses the intl heading", () => {
    render(<WhatIveShipped />);
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "What I\u{2019}ve shipped"
      })
    ).toBeDefined();
  });

  it("renders projects in source order", () => {
    const { container } = render(<WhatIveShipped />);
    const names = map(container.querySelectorAll("[data-name]"), (node) => {
      return node.textContent;
    });
    expect(names[0]).toContain("Telecom provisioning platform");
    expect(names.at(-1)).toContain("Agent skills compiler");
  });
});
