import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileCard } from "./profile-card.tsx";

describe("ProfileCard", () => {
  it("renders the profile card with the user's name and links", () => {
    render(<ProfileCard />);

    // Renders the name (Avatar includes it for accessibility; our span is also present)
    expect(screen.getAllByText("Ethan Glover").length).toBeGreaterThanOrEqual(
      1
    );

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
      "https://calendar.proton.me/u/2/bookings#10S2zo5jm_rTCXVDnyi55vEBS9HN8Cam4w3HxHr5Omg="
    );
  });
});
