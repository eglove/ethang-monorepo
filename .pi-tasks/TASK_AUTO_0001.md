---
id: TASK_AUTO_0001
state: in_progress
phase: done
created_at: 2026-08-08T20:50:44.387Z
updated_at: 2026-08-08T20:50:44.387Z
title: for this monorepo I want pi agent to prefer using the webstorm mcp for all possible operations it provides tools for
---

## feature prompt

for this monorepo I want pi agent to prefer using the webstorm mcp for all possible operations it provides tools for

## clarifications

Q1: Should the WebStorm MCP integration be implemented as a custom extension that wraps the MCP protocol directly, or do you already have an existing pi package (or know of one) that provides MCP tool support? This decides whether the feature splits into tasks for building an MCP client from scratch versus configuring and installing third-party code.
A1: implement as a custom extension in .pi/extensions/webstorm-mcp.ts that connects to WebStorm's MCP server and registers tools with fallback behavior
Q2: What transport protocol should be used to connect to WebStorm's MCP server (stdio subprocess, HTTP/SSE, or WebSocket)? This determines whether we spawn a child process, make network calls, and how configuration is handled.
A2: Use stdio via child_process with a configurable command/arguments in settings.json, as it's the most common MCP transport pattern and allows direct IPC without needing to implement HTTP handlers or WebSocket clients. (accepted recommendation)

## tasks

- [ ] Create project structure and settings configuration for WebStorm MCP extension — implement as custom extension in .pi/extensions/webstorm-mcp.ts | decisions (explicit user choices — these OVERRIDE the spec doc wherever they conflict; follow them exactly): implement as a custom extension in .pi/extensions/webstorm-mcp.ts that connects to WebStorm's MCP server and registers tools with fallback behavior
- [ ] Implement stdio transport layer using child_process — spawn configurable command/arguments from settings.json, manage stdin/stdout communication for MCP protocol | decisions (explicit user choices — these OVERRIDE the spec doc wherever they conflict; follow them exactly): use stdio via child_process with a configurable command/arguments in settings.json
- [ ] Build MCP client infrastructure and tool registration mechanism — handle protocol initialization, send/receive messages, register available tools with fallback behavior | decisions (explicit user choices — these OVERRIDE the spec doc wherever they conflict; follow them exactly): implement as a custom extension in .pi/extensions/webstorm-mcp.ts that connects to WebStorm's MCP server and registers tools with fallback behavior
- [ ] Develop robust fallback mechanism when WebStorm MCP is unavailable or times out — implement timeout handling, graceful degradation to alternative tools, and error recovery | decisions (explicit user choices — these OVERRIDE the spec doc wherever they conflict; follow them exactly): implement as a custom extension in .pi/extensions/webstorm-mcp.ts that connects to WebStorm's MCP server and registers tools with fallback behavior
- [ ] Integrate extension into pi agent's tool selection priority system — modify tool discovery and invocation logic to prefer WebStorm MCP tools when available, ensure fallback behavior is invoked on failure | decisions (explicit user choices — these OVERRIDE the spec doc wherever they conflict; follow them exactly): implement as a custom extension in .pi/extensions/webstorm-mcp.ts that connects to WebStorm's MCP server and registers tools with fallback behavior

## coverage

1 grounded requirement(s): 1 task-mapped, 0 cross-cutting (carried into every task via .pi-tasks/requirements.md), 0 unowned
