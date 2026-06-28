import type { MCPToolSource } from "@tanstack/ai";

import { webstormMcp } from "../mcp/webstorm.ts";

export async function getMCPClients(): Promise<MCPToolSource[]> {
  const wsClient = await webstormMcp();

  const clients: MCPToolSource[] = [];

  if (null !== wsClient) {
    // @ts-expect-error allow this
    clients.push(wsClient);
  }

  return clients;
}
