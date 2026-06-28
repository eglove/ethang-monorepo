import { beforeEach, describe, expect, it, vi } from "vitest";

const webstormMcpMock = vi.fn();

vi.mock("../mcp/webstorm.ts", () => {
  return {
    webstormMcp: webstormMcpMock
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getMCPClients", () => {
  it("returns an array with the client when connection succeeds", async () => {
    const fakeClient = { id: "webstorm" };
    webstormMcpMock.mockResolvedValue(fakeClient);

    const { getMCPClients } = await import("./mcp-clients.js");
    const clients = await getMCPClients();

    expect(clients).toEqual([fakeClient]);
    expect(webstormMcpMock).toHaveBeenCalledOnce();
  });

  it("returns an empty array when webstormMcp resolves to null", async () => {
    webstormMcpMock.mockResolvedValue(null);

    const { getMCPClients } = await import("./mcp-clients.js");
    const clients = await getMCPClients();

    expect(clients).toEqual([]);
  });
});
