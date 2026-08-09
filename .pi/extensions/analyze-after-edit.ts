import type { ExtensionAPI, ToolResultEvent } from "@earendil-works/pi-coding-agent";
import { join, relative } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

// MCP configuration for WebStorm
const MCP_BASE_URL = "http://127.0.0.1:64506";
const MCP_SSE_ENDPOINT = `${MCP_BASE_URL}/sse`;

/**
 * WebStorm MCP Client using SSE for session establishment.
 * Connects to the SSE stream, receives endpoint URL and session ID,
 * then makes HTTP POST requests to that endpoint.
 */
class WebStormMCPClient {
  private sseUrl = `${MCP_BASE_URL}/sse`;
  private sessionUrl?: string;
  private sessionId?: string;
  private eventSource?: EventSource;

  /**
   * Connect to the WebStorm MCP SSE endpoint and receive endpoint URL & session ID.
   */
  async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Create a new EventSource connection with proper headers
        this.eventSource = new EventSource(this.sseUrl, {
          headers: {
            "IJ_MCP_SERVER_PROJECT_PATH": "C:/Users/glove/projects/ethang-monorepo",
            "Accept": "application/json,text/event-stream",
          },
        });

        let setupTimeout: ReturnType<typeof setTimeout> | undefined;

        this.eventSource.onmessage = (event: MessageEvent) => {
          console.log("MCP SSE received:", event.data);
          try {
            const data = JSON.parse(event.data) as any;
            
            // First message should contain endpoint and session ID
            if (!this.sessionUrl || !this.sessionId) {
              this.sessionUrl = data.endpoint?.url || data.url || data.endpointUrl || "";
              this.sessionId = data.sessionId || data.session_id || "";

              if (this.sessionUrl && this.sessionId) {
                console.log(`✓ MCP session established: sessionId=${this.sessionId}, endpoint=${this.sessionUrl}`);
                
                // Clear the timeout since we got a response
                if (setupTimeout) clearTimeout(setupTimeout);
                resolve(true);
              } else {
                console.warn("MCP SSE incomplete data:", data);
              }
            }
          } catch (parseError) {
            console.error("Failed to parse MCP SSE message:", event.data, parseError);
          }
        };

        this.eventSource.onerror = async (error: any) => {
          console.error("MCP SSE connection error:", error);
          // Clean up and reject if still not established after timeout
          await this.disconnect();
          if (!this.sessionUrl || !this.sessionId) {
            reject(new Error("Failed to establish MCP session"));
          }
        };

        this.eventSource.onopen = () => {
          console.log("MCP SSE connection opened (waiting for endpoint message)");
        };

        // Set a timeout - if we don't get an endpoint within 10 seconds, give up
        setupTimeout = setTimeout(() => {
          if (!this.sessionUrl || !this.sessionId) {
            this.disconnect().finally();
            reject(new Error("MCP connection timed out: no session established"));
          }
        }, 10000);

      } catch (error: any) {
        console.error("Failed to create MCP SSE connection:", error.message);
        reject(error);
      }
    });
  }

  /**
   * Send an MCP request via HTTP POST to the endpoint URL.
   */
  async sendRequest(request: any): Promise<any> {
    if (!this.sessionUrl || !this.sessionId) {
      throw new Error("Not connected to MCP server. Call connect() first.");
    }

    try {
      const response = await fetch(this.sessionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json,text/event-stream",
          "IJ_MCP_SERVER_PROJECT_PATH": "C:/Users/glove/projects/ethang-monorepo",
          // Include session ID if needed
          ...(this.sessionId ? { "x-session-id": this.sessionId } : {}),
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`MCP request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error("MCP request error:", error.message);
      throw error;
    }
  }

  /**
   * Close the SSE connection.
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = undefined;
        console.log("MCP SSE connection closed");
      }
      this.sessionUrl = undefined;
      this.sessionId = undefined;
      resolve();
    });
  }

  /**
   * Check if currently connected and session established.
   */
  isConnected(): boolean {
    return !!this.eventSource && 
           this.eventSource.readyState === EventSource.OPEN &&
           !!this.sessionUrl && 
           !!this.sessionId;
  }

  /**
   * Get the current endpoint URL (for debugging).
   */
  getEndpointURL(): string | undefined {
    return this.sessionUrl;
  }
}

// Singleton instance for reuse across calls
const webstormMCPClient = new WebStormMCPClient();

export default function (pi: ExtensionAPI) {
  /**
   * Execute a shell command in the project root.
   */
  async function runCommand(command: string, cwd?: string): Promise<{ output: string; exitCode: number }> {
    const targetCwd = cwd || pi.cwd;
    try {
      const output = execSync(command, { cwd: targetCwd, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] });
      return { output, exitCode: 0 };
    } catch (error: any) {
      const { stderr = "", stdout = "" } = error;
      return {
        output: String(stderr) + "\n" + String(stdout),
        exitCode: error.status ?? 1,
      };
    }
  }



  /**
   * Call WebStorm MCP tool to get file problems.
   */
  async function getWebStormProblems(filePath: string): Promise<string> {
    try {
      // Connect if not already connected
      if (!webstormMCPClient.isConnected()) {
        await webstormMCPClient.connect();
      }

      // Prepare the MCP request (JSON-RPC format)
      const request = {
        jsonrpc: "2.0",
        method: "get_file_problems",
        params: { filePath },
        id: Date.now(),
      };

      console.log("Sending MCP request to:", webstormMCPClient.getEndpointURL());

      // Send and wait for response
      const result = await webstormMCPClient.sendRequest(request);

      if (!result || Object.keys(result).length === 0) {
        return "WebStorm MCP analysis returned empty results.";
      }

      return JSON.stringify(result, null, 2);
    } catch (error: any) {
      // Provide helpful error messages based on the error type
      if (error.message?.includes("timed out") || error.message?.includes("no session established")) {
        return "WebStorm MCP server not available. Please ensure WebStorm is running with MCP enabled.";
      } else if (error.message?.includes("Failed to establish MCP session")) {
        return "Connection to WebStorm MCP timed out. Check that port 64506 is open and accessible.";
      } else if (error.message?.includes("Authentication required")) {
        return `WebStorm MCP authentication failed: ${error.message}`;
      } else {
        return `WebStorm analysis failed: ${error.message}`;
      }
    }
  }

  /**
   * Format combined analysis results for display.
   */
  function formatAnalysisResult(
    filePath: string,
    eslintOutput: string,
    webstormOutput: string,
  ): string {
    const lines = [];
    lines.push(`**File:** ${filePath}`);

    if (eslintOutput) {
      lines.push(`\n**ESLint Issues:**`);
      // Truncate for readability, but keep full output in a separate property if needed
      const displayEslint = eslintOutput.length > 2000 ? `${eslintOutput.substring(0, 2000)}... (truncated)` : eslintOutput;
      lines.push(displayEslint);
    }

    if (webstormOutput) {
      lines.push(`\n**WebStorm Problems:**`);
      const displayWebstorm = webstormOutput.length > 2000 ? `${webstormOutput.substring(0, 2000)}... (truncated)` : webstormOutput;
      lines.push(displayWebstorm);
    }

    if (!eslintOutput && !webstormOutput) {
      lines.push("\nNo issues found.");
    }

    return lines.join("\n");
  }

  /**
   * Extract modified file paths from tool_result event structure.
   */
  function extractModifiedFiles(event: ToolResultEvent): string[] {
    const files: string[] = [];

    // Helper to process details recursively
    const processDetails = (details: any) => {
      if (!details) return;
      
      // Check for modifiedFiles array directly
      if (Array.isArray(details.modifiedFiles)) {
        files.push(...details.modifiedFiles);
        return;
      }
      
      // Check nested structure: details.files?.modifiedFiles
      if (details.files && Array.isArray(details.files.modifiedFiles)) {
        files.push(...details.files.modifiedFiles);
        return;
      }
      
      // Recurse into other fields that might contain file paths
      for (const key of Object.keys(details)) {
        processDetails(details[key]);
      }
    };

    try {
      // First check event.details
      if (event.details) {
        processDetails(event.details);
      }
      
      // Also check event.result for modifiedFiles (in case details is empty)
      if (files.length === 0 && event.result) {
        processDetails(event.result);
      }
    } catch (e) {
      console.error("Failed to extract file paths:", e);
    }

    return files;
  }

  /**
   * Main handler for tool_result events after edit/write operations.
   */
  pi.on("tool_result", async (event, ctx) => {
    // Only process edit or write tools with successful execution
    if (!event.toolName || !["edit", "write"].includes(event.toolName)) return;
    if (event.result?.isError === true) return;

    // Extract modified file paths from the event structure
    const filesToAnalyze = new Set<string>();
    let baseDir = ctx.cwd;

    const extracted = extractModifiedFiles(event);
    for (const filePath of extracted) {
      const absolutePath = filePath.startsWith("/") ? filePath : join(baseDir, filePath);
      // Only add if the file exists in the project
      if (existsSync(absolutePath)) {
        filesToAnalyze.add(absolutePath);
      }
    }

    // If no paths found, skip analysis
    if (filesToAnalyze.size === 0) return;

    // Analyze each modified file in parallel with error handling for individual files
    await Promise.allSettled(Array.from(filesToAnalyze).map(async (filePath) => {
      try {
        const [eslintRes, webstormRes] = await Promise.allSettled([
          runCommand(`pnpm eslint "${filePath}" --format json`, baseDir),
          getWebStormProblems(filePath),
        ]);

        const eslintOutput = eslintRes.status === "fulfilled" ? eslintRes.value.output : "";
        const webstormOutput = webstormRes.status === "fulfilled" ? (webstormRes.value as string) : "";

        // Format and display the analysis result
        const displayText = formatAnalysisResult(filePath, eslintOutput, webstormOutput);
        
        // Send notification to TUI - don't wait for response
        ctx.ui.notify(`Code Analysis: ${relative(baseDir, filePath)}`, displayText, { type: "info" });
      } catch (error: any) {
        console.error(`Failed to analyze ${filePath}:`, error.message);
      }
    }));
  });
}
