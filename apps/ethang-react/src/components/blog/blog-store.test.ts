import { describe, expect, it } from "vitest";

import { blogStore, blogStoreActions } from "./blog-store.ts";

describe("blogStore", () => {
  it("initializes on page 1", () => {
    expect(blogStore.state.paginationPage).toBe(1);
  });
});

describe("blogStoreActions", () => {
  it("increments pagination page", () => {
    blogStoreActions.setPage(5);
    blogStoreActions.incrementPage();
    expect(blogStore.state.paginationPage).toBe(6);
  });

  it("decrements pagination page", () => {
    blogStoreActions.setPage(5);
    blogStoreActions.decrementPage();
    expect(blogStore.state.paginationPage).toBe(4);
  });

  it("sets pagination page to a specific value", () => {
    blogStoreActions.setPage(2);
    expect(blogStore.state.paginationPage).toBe(2);
  });

  it("decodes nothing and just returns when at zero", () => {
    blogStoreActions.setPage(0);
    blogStoreActions.decrementPage();
    expect(blogStore.state.paginationPage).toBe(-1);
  });
});
