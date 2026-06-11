import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileCard } from "./profile-card.tsx";

describe("ProfileCard", () => {
  it("renders the profile card with the user's name and links", () => {
    render(<ProfileCard />);

    // Renders the name
    expect(screen.getByText("Ethan Glover")).toBeDefined();

    // Renders links
    const linkedInLink = screen.getByRole("link", { name: "LinkedIn" });
    expect(linkedInLink.getAttribute("href")).toBe(
      "https://www.linkedin.com/in/ethan-glover/"
    );

    const gitHubLink = screen.getByRole("link", { name: "GitHub" });
    expect(gitHubLink.getAttribute("href")).toBe("https://github.com/eglove");

    const emailLink = screen.getByRole("link", { name: "Email" });
    expect(emailLink.getAttribute("href")).toBe("mailto:hello@ethang.email");

    const newsletterLink = screen.getByRole("link", {
      name: "Subscribe to my Newsletter"
    });
    expect(newsletterLink.getAttribute("href")).toContain("newsletter-follow");

    const meetingLink = screen.getByRole("link", {
      name: "Schedule a Meeting"
    });
    expect(meetingLink.getAttribute("href")).toBe(
      "https://cal.com/ethan-glover/meet"
    );
  });
});
