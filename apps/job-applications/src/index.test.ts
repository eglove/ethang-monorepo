import { describe, expect, it, vi } from "vitest";

vi.mock("cloudflare:workers", () => {
  return {
    WorkerEntrypoint: class {
      public ctx = {};
      public env: Record<string, unknown> = {};

      public fetch(_request: Request) {
        return new Response("OK", { status: 200 });
      }
    }
  };
});

import JobAppsServiceClass from "./index.ts";

describe("JobAppsService", () => {
  it("responds OK to a plain fetch", () => {
    const initializer =
      JobAppsServiceClass as unknown as new () => InstanceType<
        typeof JobAppsServiceClass
      >;
    const service = new initializer();
    const response = service.fetch(new Request("https://example.com/"));
    expect(response.status).toBe(200);
  });
});
