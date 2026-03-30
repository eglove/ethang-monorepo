import { afterEach, describe, expect, it, vi } from "vitest";

import { workify } from "../../src/worker/workify.ts";

const makeWorkerMock = () => {
  let messageHandler: ((event: { data: unknown }) => void) | undefined;
  const terminate = vi.fn();

  const worker = {
    addEventListener: vi
      .fn()
      .mockImplementation(
        (type: string, handler: (event: { data: unknown }) => void) => {
          if ("message" === type) {
            messageHandler = handler;
          }
        },
      ),
    postMessage: vi.fn().mockImplementation(() => {
      messageHandler?.({ data: "pong" });
    }),
    terminate,
  };

  return { terminate, worker };
};

describe(workify, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves with the value posted by the worker", async () => {
    const { worker } = makeWorkerMock();
    vi.stubGlobal("Worker", vi.fn().mockImplementation(function () { return worker; }));
    vi.stubGlobal("URL", { createObjectURL: vi.fn().mockReturnValue("blob:x") });

    const fn = workify(() => "pong");
    const result = await fn();

    expect(result).toBe("pong");
  });

  it("terminates the worker when the AbortSignal fires", () => {
    const { terminate, worker } = makeWorkerMock();
    vi.stubGlobal("Worker", vi.fn().mockImplementation(function () { return worker; }));
    vi.stubGlobal("URL", { createObjectURL: vi.fn().mockReturnValue("blob:x") });

    const controller = new AbortController();
    workify(() => 0, controller.signal);
    controller.abort();

    expect(terminate).toHaveBeenCalledOnce();
  });
});
