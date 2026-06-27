import type { MCPToolSource } from "@tanstack/ai";

import { codebaseMemoryMcp } from "../mcp/codebase-memory.ts";
import { webstormMcp } from "../mcp/webstorm.ts";

export async function getMCPClients(): Promise<MCPToolSource[]> {
  const cmClient = await codebaseMemoryMcp();
  const wsClient = await webstormMcp();

  const clients: MCPToolSource[] = [];
  if (null !== cmClient) {
    clients.push(cmClient);
  }
  if (null !== wsClient) {
    clients.push(wsClient);
  }

  return clients;
}
