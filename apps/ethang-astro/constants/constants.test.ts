import { describe, expect, it } from "vitest";

import { courses } from "./courses.ts";

const EXPECTED_COPY = "exposes the expected copy";
import { forms } from "./forms.ts";
import { home } from "./home.ts";
import { navigation } from "./navigation.ts";
import { rss } from "./rss.ts";

describe("courses constants", () => {
  it(EXPECTED_COPY, () => {
    expect(courses).toEqual({
      BY: "by",
      COURSE: "course",
      COURSE_NOT_FOUND: "Course not found",
      COURSES: "courses",
      FAILED_TO_CREATE_CURRICULUM: "Failed to create curriculum",
      LAST_UPDATED: "Last Updated:",
      LEARNING_PATH_IDS_MISSING: "The following learning path IDs do not exist:"
    });
  });
});

describe("forms constants", () => {
  it(EXPECTED_COPY, () => {
    expect(forms).toEqual({
      EMAIL_ADDRESS: "Email Address",
      ENTER_YOUR_EMAIL: "Enter your email",
      ENTER_YOUR_PASSWORD: "Enter your password",
      PASSWORD: "Password",
      SCHEDULE_MEETING: "Schedule a Meeting",
      SIGN_IN: "Sign In",
      SIGN_IN_TO_ACCOUNT: "Sign In to Your Account",
      SIGNING_IN: "Signing In..."
    });
  });
});

describe("navigation constants", () => {
  it(EXPECTED_COPY, () => {
    expect(navigation).toEqual({
      BLOG: "Blog",
      COURSES: "Courses",
      HOME: "Home",
      LOGGED_IN_AS: "Logged in as",
      LOGIN: "Login",
      LOGOUT: "Logout",
      RSS: "RSS",
      TIPS: "Tips"
    });
  });
});

describe("rss constants", () => {
  it(EXPECTED_COPY, () => {
    expect(rss).toEqual({
      ADD_FEED: "Add Feed",
      ALL_FEEDS: "All Feeds",
      FEED_XML_URL: "Feed XML URL",
      FEEDS: "Feeds",
      LOAD_MORE: "Load More",
      MARK_AS_READ: "Mark as Read",
      NO_SUBSCRIPTIONS: "No subscriptions found.",
      NO_UNREAD_ARTICLES: "No unread articles.",
      UNSUBSCRIBE: "Unsubscribe",
      UNSUBSCRIBE_CONFIRM_DESCRIPTION:
        "You will no longer receive new articles from this feed.",
      UNSUBSCRIBE_CONFIRM_TITLE: "Unsubscribe from feed?"
    });
  });
});

describe("home constants", () => {
  it("describes the Astro homepage", () => {
    expect(home.MONOREPO_PROJECTS.HOME_PAGE.NAME).toBe(
      "This home page (ethang-astro)"
    );
  });
});
