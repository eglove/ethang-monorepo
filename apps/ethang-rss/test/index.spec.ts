import {
  createExecutionContext,
  env,
  SELF,
  waitOnExecutionContext
} from "cloudflare:test";
import { describe, expect, it } from "vitest";

import worker from "../src/index.ts";

// @ts-expect-error allow
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Hello World worker", () => {
  it("responds with Hello World! (unit style)", async () => {
    // @ts-expect-error allow
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,sonar/new-operator-misuse
    const request = new IncomingRequest("http://example.com");

    const context = createExecutionContext();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await worker.fetch(request, env, context);

    await waitOnExecutionContext(context);
    expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
  });

  it("responds with Hello World! (integration style)", async () => {
    const response = await SELF.fetch("https://example.com");
    expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
  });
});
