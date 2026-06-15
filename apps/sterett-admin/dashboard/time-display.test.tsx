import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimeDisplay } from "./time-display.tsx";

describe("TimeDisplay component", () => {
  it("renders the formatted date correctly", () => {
    render(<TimeDisplay date="2023-01-01T12:00:00.000Z" />);

    const element = screen.getByText("Jan 1, 2023");
    expect(element).toBeDefined();
    expect(element.tagName).toBe("STRONG");
  });
});
