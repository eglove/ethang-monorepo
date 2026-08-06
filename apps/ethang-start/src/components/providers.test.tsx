import { useTheme } from "@astryxdesign/core/theme";
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Providers } from "./providers.tsx";

beforeAll(() => {
  // jsdom does not implement matchMedia; stub it for useTheme's media query.
  const matchMediaStub = (query: string) => {
    return {
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn()
    };
  };
  vi.stubGlobal("matchMedia", matchMediaStub);
  Object.defineProperty(globalThis, "matchMedia", { value: matchMediaStub });
});

const ModeProbe = () => {
  const { mode, tokens } = useTheme();

  return (
    <output data-mode={mode} data-testid="probe">
      {tokens["--color-background-body"]}
    </output>
  );
};

describe("Providers", () => {
  it("mounts the nightowl theme forced to dark mode", () => {
    render(
      <Providers>
        <ModeProbe />
      </Providers>
    );

    const probe = screen.getByTestId("probe");
    expect(probe.dataset["mode"]).toBe("dark");
    expect(probe.textContent).toBe("#011627");
  });
});
