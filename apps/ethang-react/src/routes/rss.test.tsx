/* eslint-disable sonar/max-lines-per-function, sonar/no-duplicate-string, @typescript-eslint/no-non-null-assertion */
import type { ComponentType, ReactNode } from "react";

import { MockedProvider } from "@apollo/client/testing/react/index.js";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import noop from "lodash/noop.js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authStore } from "../components/auth/auth-store.ts";
import {
  ADD_SUBSCRIPTION,
  decodeHtmlEntities,
  GET_SUBSCRIPTIONS_WITH_ARTICLES,
  MARK_ARTICLE_READ,
  parseXmlUrl,
  Route
} from "./rss.tsx";

const mockNavigate = vi.fn(async () => {
  //
});

let redirectMock: unknown = null;

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@tanstack/react-router"
  );
  return {
    ...actual,
    createFileRoute: (path: string) => {
      return (options: {
        beforeLoad?: () => void;
        component: ComponentType;
      }) => {
        return {
          options,
          path,
          useSearch: () => {
            return {};
          }
        };
      };
    },
    Link: ({
      children,
      href,
      to
    }: Readonly<{ children: ReactNode; href?: string; to?: string }>) => {
      return <a href={to ?? href}>{children}</a>;
    },
    redirect: (_arguments: unknown) => {
      redirectMock = _arguments;
      throw new Error("Redirecting");
    },
    useNavigate: () => {
      return mockNavigate;
    }
  };
});

const mockSubscriptionsData = {
  subscriptions: {
    edges: [
      {
        node: {
          articles: {
            edges: [
              {
                node: {
                  id: "art-1",
                  isRead: false,
                  link: "https://test1.com/art1",
                  publishedAt: "2026-06-11T12:00:00Z",
                  title: "Article 1"
                }
              },
              {
                node: {
                  id: "art-2",
                  isRead: false,
                  link: "https://test1.com/art2",
                  publishedAt: "2026-06-11T10:00:00Z",
                  title: "Article 2"
                }
              }
            ]
          },
          id: "feed-1",
          title: "Test Feed 1",
          website: "https://test1.com",
          xmlAddress: "https://test1.com/rss"
        }
      },
      {
        node: {
          articles: {
            edges: [
              {
                node: {
                  id: "art-3",
                  isRead: false,
                  link: "https://test2.com/art3",
                  publishedAt: "2026-06-11T11:00:00Z",
                  title: "Article 3"
                }
              }
            ]
          },
          id: "feed-2",
          title: "Test Feed 2",
          website: "https://test2.com",
          xmlAddress: "https://test2.com/rss"
        }
      }
    ]
  }
};

describe("RSS Feature", () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.reset();
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    redirectMock = null;
  });

  describe("URL Parser Helper", () => {
    it("extracts hostname as title and origin as website from a valid XML URL", () => {
      const result = parseXmlUrl("https://example.com/feed.xml");
      expect(result).toEqual({
        title: "example.com",
        website: "https://example.com",
        xmlAddress: "https://example.com/feed.xml"
      });
    });

    it("returns empty strings for title and website if the URL is invalid", () => {
      const result = parseXmlUrl("not-a-valid-url");
      expect(result).toEqual({
        title: "",
        website: "",
        xmlAddress: "not-a-valid-url"
      });
    });
  });

  describe("RSS Route Protection", () => {
    it("redirects unauthenticated user to login route with redirect parameter", () => {
      // Setup state where no user is logged in
      authStore.signOut();

      // Trigger beforeLoad
      try {
        // @ts-expect-error for test
        Route.options.beforeLoad?.();
      } catch {
        // expected redirect error
      }

      expect(redirectMock).toEqual({
        search: {
          redirect: "/rss"
        },
        to: "/login"
      });
    });

    it("does not redirect when user is authenticated", () => {
      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      let redirectThrown = false;
      try {
        // @ts-expect-error for test
        Route.options.beforeLoad?.();
      } catch {
        redirectThrown = true;
      }

      expect(redirectThrown).toBe(false);
    });
  });

  describe("RSS Route Component States", () => {
    it("shows loading skeleton when query is fetching", () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: new Promise(noop)
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      expect(screen.getByTestId("sidebar-skeleton")).toBeDefined();
      expect(screen.getByTestId("articles-skeleton")).toBeDefined();
    });

    it("shows empty state when user has no subscriptions", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: {
              subscriptions: {
                edges: []
              }
            }
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/no subscriptions found/iu)).toBeDefined();
      });
    });

    it("shows no unread articles state when user has subscriptions but no unread articles", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: {
              subscriptions: {
                edges: [
                  {
                    node: {
                      articles: {
                        edges: []
                      },
                      id: "feed-1",
                      title: "Test Feed 1",
                      website: "https://test1.com",
                      xmlAddress: "https://test1.com/rss"
                    }
                  }
                ]
              }
            }
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/no unread articles/iu)).toBeDefined();
      });
    });

    it("renders aggregated unread articles sorted by date descending for 'All Feeds'", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: mockSubscriptionsData
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Test Feed 1" })
        ).toBeDefined();
        expect(
          screen.getByRole("button", { name: "Test Feed 2" })
        ).toBeDefined();
      });

      // Aggregated articles sorted descending by publishedAt:
      // art-1 (12:00), art-3 (11:00), art-2 (10:00)
      const articles = screen.getAllByRole("link", { name: /article/iu });
      expect(articles).toHaveLength(3);
      expect(articles[0]?.textContent).toBe("Article 1");
      expect(articles[1]?.textContent).toBe("Article 3");
      expect(articles[2]?.textContent).toBe("Article 2");
    });

    it("filters article list by selected feed when a sidebar item is clicked", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: mockSubscriptionsData
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Test Feed 2" })
        ).toBeDefined();
      });

      // Click Test Feed 2 in the sidebar
      fireEvent.click(screen.getByRole("button", { name: "Test Feed 2" }));

      // Now only Article 3 should be displayed
      const articles = screen.getAllByRole("link", { name: /article/iu });
      expect(articles).toHaveLength(1);
      expect(articles[0]?.textContent).toBe("Article 3");
    });
  });

  describe("RSS Form Submission", () => {
    it("disables input during mutation, calls addSubscription mutation, and refetches", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: mockSubscriptionsData
          }
        },
        {
          request: {
            query: ADD_SUBSCRIPTION,
            variables: {
              title: "example.com",
              website: "https://example.com",
              xmlAddress: "https://example.com/rss.xml"
            }
          },
          result: {
            data: {
              addSubscription: {
                id: "feed-3",
                title: "example.com",
                website: "https://example.com",
                xmlAddress: "https://example.com/rss.xml"
              }
            }
          }
        },
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: {
              subscriptions: {
                edges: [
                  ...mockSubscriptionsData.subscriptions.edges,
                  {
                    node: {
                      articles: { edges: [] },
                      id: "feed-3",
                      title: "example.com",
                      website: "https://example.com",
                      xmlAddress: "https://example.com/rss.xml"
                    }
                  }
                ]
              }
            }
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/feed xml url/iu)).toBeDefined();
      });

      const input = screen.getByPlaceholderText(/feed xml url/iu);
      const submitButton = screen.getByRole("button", { name: /add feed/iu });

      fireEvent.change(input, {
        target: { value: "https://example.com/rss.xml" }
      });
      fireEvent.click(submitButton);

      expect(input).toHaveProperty("disabled", true);
      expect(submitButton).toHaveProperty("disabled", true);

      await waitFor(() => {
        expect(screen.getByText("example.com")).toBeDefined();
      });

      expect(input).toHaveProperty("disabled", false);
      expect(input).toHaveProperty("value", "");
    });
  });

  describe("RSS Article Interactions", () => {
    it("calls markArticleRead mutation on click and immediately hides article", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: mockSubscriptionsData
          }
        },
        {
          request: {
            query: MARK_ARTICLE_READ,
            variables: {
              articleId: "art-1",
              isRead: true
            }
          },
          result: {
            data: {
              markArticleRead: {
                id: "art-1",
                isRead: true
              }
            }
          }
        },
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: {
              subscriptions: {
                edges: [
                  {
                    node: {
                      ...mockSubscriptionsData.subscriptions.edges[0]!.node,
                      articles: {
                        edges: [
                          {
                            node: {
                              id: "art-2",
                              isRead: false,
                              link: "https://test1.com/art2",
                              publishedAt: "2026-06-11T10:00:00Z",
                              title: "Article 2"
                            }
                          }
                        ]
                      }
                    }
                  },
                  mockSubscriptionsData.subscriptions.edges[1]
                ]
              }
            }
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Article 1")).toBeDefined();
      });

      const markReadButtons = screen.getAllByRole("button", {
        name: /mark as read/iu
      });
      fireEvent.click(markReadButtons[0]!); // Article 1's mark as read button

      await waitFor(() => {
        expect(screen.queryByText("Article 1")).toBeNull();
      });
    });

    it("handles markArticleRead mutation error gracefully", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: mockSubscriptionsData
          }
        },
        {
          error: new Error("mutation failed"),
          request: {
            query: MARK_ARTICLE_READ,
            variables: {
              articleId: "art-1",
              isRead: true
            }
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Article 1")).toBeDefined();
      });

      const markReadButtons = screen.getAllByRole("button", {
        name: /mark as read/iu
      });
      fireEvent.click(markReadButtons[0]!); // Article 1's mark as read button

      // It should not remove the article because the mutation failed
      await waitFor(() => {
        expect(screen.getByText("Article 1")).toBeDefined();
      });
    });
  });

  describe("HTML Entity Decoder Helper", () => {
    it("decodes HTML entities correctly", () => {
      expect(decodeHtmlEntities("Test &amp; Co")).toBe("Test & Co");
      expect(decodeHtmlEntities("&#037;")).toBe("%");
      expect(decodeHtmlEntities("Hello &quot;World&quot;")).toBe(
        'Hello "World"'
      );
    });

    it("returns original string if empty or undefined", () => {
      expect(decodeHtmlEntities("")).toBe("");
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      expect(decodeHtmlEntities(null as unknown as string)).toBeNull();
    });

    it("returns original string if DOMParser throws an error", () => {
      const originalDOMParser = globalThis.DOMParser;
      // @ts-expect-error for test
      globalThis.DOMParser = class extends originalDOMParser {
        // @ts-expect-error for test
        public override parseFromString() {
          throw new Error("mock error");
        }
      };

      try {
        expect(decodeHtmlEntities("some text")).toBe("some text");
      } finally {
        globalThis.DOMParser = originalDOMParser;
      }
    });
  });

  describe("RSS Form Submission Edge Cases", () => {
    it("does not submit if URL is empty", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: mockSubscriptionsData
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/feed xml url/iu)).toBeDefined();
      });

      const input = screen.getByPlaceholderText(/feed xml url/iu);

      fireEvent.change(input, { target: { value: "   " } });
      const form = input.closest("form");
      if (form) {
        fireEvent.submit(form);
      }

      // Input should not be disabled since request was not made
      expect(input).toHaveProperty("disabled", false);
    });

    it("does not submit if URL is invalid", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: mockSubscriptionsData
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/feed xml url/iu)).toBeDefined();
      });

      const input = screen.getByPlaceholderText(/feed xml url/iu);

      fireEvent.change(input, { target: { value: "not-a-valid-url" } });
      const form = input.closest("form");
      if (form) {
        fireEvent.submit(form);
      }

      // Input should not be disabled
      expect(input).toHaveProperty("disabled", false);
    });
  });

  describe("Sorting Edge Cases", () => {
    it("sorts articles with same publishedAt date using id comparison", async () => {
      const sameDateMocks = {
        subscriptions: {
          edges: [
            {
              node: {
                articles: {
                  edges: [
                    {
                      node: {
                        id: "art-b",
                        isRead: false,
                        link: "https://test1.com/artb",
                        publishedAt: null,
                        title: "Article B"
                      }
                    },
                    {
                      node: {
                        id: "art-a",
                        isRead: false,
                        link: "https://test1.com/arta",
                        title: "Article A"
                      }
                    }
                  ]
                },
                id: "feed-1",
                title: "Test Feed 1",
                website: "https://test1.com",
                xmlAddress: "https://test1.com/rss"
              }
            }
          ]
        }
      };

      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: sameDateMocks
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        const articles = screen.getAllByRole("link", { name: /article/iu });
        expect(articles).toHaveLength(2);
        // "art-b" comes first in descending order because "art-b".localeCompare("art-a") > 0
        expect(articles[0]?.textContent).toBe("Article B");
        expect(articles[1]?.textContent).toBe("Article A");
      });
    });
  });

  describe("All Feeds Button Click", () => {
    it("should display all articles again after clicking a specific feed and then clicking All Feeds", async () => {
      const mocks = [
        {
          request: {
            query: GET_SUBSCRIPTIONS_WITH_ARTICLES
          },
          result: {
            data: mockSubscriptionsData
          }
        }
      ];

      // @ts-expect-error for test
      authStore.update((draft) => {
        draft.user = {
          email: "a@a.com",
          sessionToken: "token",
          username: "user"
        };
      });

      const RssComponent = Route.options.component;
      render(
        // @ts-expect-error for test
        <MockedProvider mocks={mocks} addTypename={false}>
          {/* @ts-expect-error for test */}
          <RssComponent />
        </MockedProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Test Feed 2" })
        ).toBeDefined();
      });

      // Filter by Test Feed 2
      fireEvent.click(screen.getByRole("button", { name: "Test Feed 2" }));
      expect(screen.getAllByRole("link", { name: /article/iu })).toHaveLength(
        1
      );

      // Click All Feeds
      fireEvent.click(screen.getByRole("button", { name: "All Feeds" }));
      expect(screen.getAllByRole("link", { name: /article/iu })).toHaveLength(
        3
      );
    });
  });
});
