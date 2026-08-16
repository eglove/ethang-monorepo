import { describe, expect, it } from "vitest";

import { JobApplicationsService } from "./index.ts";

describe("JobApplicationsService", () => {
  it("responds OK to a plain fetch", async () => {
    const service = new JobApplicationsService(
      { waitUntil: () => undefined } as unknown as ExecutionContext,
      {} as unknown as Env
    );
    const response = await service.fetch(new Request("https://example.com/"));
    expect(await response.text()).toBe("OK");
  });
});
