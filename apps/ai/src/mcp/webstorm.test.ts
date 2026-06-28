import { beforeEach, describe, expect, it, vi } from "vitest";

const createMCPClientMock = vi.fn();

vi.mock("@tanstack/ai-mcp", () => {
  return {
    createMCPClient: createMCPClientMock
  };
});

vi.mock("../environment.ts", () => {
  return {
    WEBSTORM_MCP_URL: "http://127.0.0.1:64506/sse"
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("webstormMcp", () => {
  it("resolves to a connected client", async () => {
    const fakeClient = { id: "ws-client" };
    createMCPClientMock.mockResolvedValue(fakeClient);

    const { webstormMcp } = await import("./webstorm.js");
    const result = await webstormMcp();

    expect(createMCPClientMock).toHaveBeenCalledOnce();
    // Verify the transport options are wired up correctly
    expect(createMCPClientMock.mock.calls[0]?.[0]).toEqual({
      transport: {
        type: "sse",
        url: "http://127.0.0.1:64506/sse"
      }
    });
    expect(result).toBe(fakeClient);
  });

  it("resolves to null when createMCPClient throws", async () => {
    createMCPClientMock.mockRejectedValue(new Error("connection refused"));

    const { webstormMcp } = await import("./webstorm.js");
    const result = await webstormMcp();

    expect(createMCPClientMock).toHaveBeenCalledOnce();
    expect(result).toBeNull();
  });
});
