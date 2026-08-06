import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { HowIWork } from "./how-work.tsx";

describe("HowIWork", () => {
  it("renders the component with data-testid", () => {
    render(<HowIWork />);
    expect(screen.getByTestId("how-i-work")).toBeDefined();
  });

  it("renders all three principle titles", () => {
    render(<HowIWork />);
    expect(screen.getByText("Hypothesis-first.")).toBeDefined();
    expect(screen.getByText("Grounded in SWEBOK.")).toBeDefined();
    expect(
      screen.getByText("Domain-Driven Design as the bridge.")
    ).toBeDefined();
  });

  it("renders principle bodies with correct text", () => {
    render(<HowIWork />);
    const text = screen.getByTestId("how-i-work").textContent;
    expect(text).toContain(
      "I write the failing test before the implementation"
    );
    expect(text).toContain("SWEBOK software engineering body of knowledge");
    expect(text).toContain("Domain-Driven Design as the bridge");
  });
});
