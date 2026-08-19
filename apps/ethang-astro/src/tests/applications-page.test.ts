import { describe, expect, it, vi } from "vitest";

const jobApplications = vi.hoisted(() => {
  return {
    listApplications: vi.fn(),
    updateApplication: vi.fn()
  };
});

vi.mock("cloudflare:workers", () => {
  return { env: { job_applications: jobApplications } };
});

import Applications from "../pages/applications.astro";

describe("applications page", () => {
  it("loads applications for an authenticated user", async () => {
    jobApplications.listApplications.mockResolvedValue({
      edges: [],
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null
      }
    });

    const route = Applications as unknown as {
      server: { load: (context: unknown) => Promise<unknown> };
    };
    await route.server.load({
      cookies: {
        get: () => {
          return { value: '{"sessionToken":"token"}' };
        }
      },
      locals: { runtime: { env: { job_applications: jobApplications } } },
      url: new URL("https://ethang.dev/applications")
    });

    expect(jobApplications.listApplications).toHaveBeenCalled();
  });
});
