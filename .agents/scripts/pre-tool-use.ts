const bannedToolsMap: Record<string, { alternative: string; skillRef: string; message: string }> = {
  "bash": {
    alternative: "PowerShell",
    skillRef: "None",
    message: "Bash is strictly banned. Use PowerShell instead."
  },
  "read_file": {
    alternative: "webstorm-mcp read_file, codebase-memory-mcp get_code_snippet, or jq (for json)",
    skillRef: "/webstorm-mcp, /codebase-memory-mcp, or /jq",
    message: "Native read_file is banned. Use WebStorm MCP or Codebase Memory MCP. For reading JSON files, you may use jq via PowerShell."
  },
  "view_file": {
    alternative: "webstorm-mcp read_file, codebase-memory-mcp get_code_snippet, or jq (for json)",
    skillRef: "/webstorm-mcp, /codebase-memory-mcp, or /jq",
    message: "Native view_file is banned. Use WebStorm MCP or Codebase Memory MCP. For reading JSON files, you may use jq via PowerShell."
  },
  "write_file": {
    alternative: "webstorm-mcp create_new_file / replace_text_in_file",
    skillRef: "/webstorm-mcp",
    message: "Native write_file is banned. Use WebStorm MCP for writing and editing files."
  },
  "edit_file": {
    alternative: "webstorm-mcp replace_text_in_file",
    skillRef: "/webstorm-mcp",
    message: "Native edit_file is banned. Use WebStorm MCP for editing files."
  },
  "replace_file_content": {
    alternative: "webstorm-mcp replace_text_in_file",
    skillRef: "/webstorm-mcp",
    message: "Native replace_file_content is banned. Use WebStorm MCP for editing files."
  },
  "write_to_file": {
    alternative: "webstorm-mcp create_new_file or replace_text_in_file",
    skillRef: "/webstorm-mcp",
    message: "Native write_to_file is banned. Use WebStorm MCP for writing files."
  },
  "multi_replace_file_content": {
    alternative: "webstorm-mcp replace_text_in_file",
    skillRef: "/webstorm-mcp",
    message: "Native multi_replace_file_content is banned. Use WebStorm MCP for editing files."
  },
  "list_dir": {
    alternative: "webstorm-mcp list_directory_tree or everything-search",
    skillRef: "/webstorm-mcp or /everything-search",
    message: "Native list_dir is banned. Use WebStorm MCP list_directory_tree or everything-search for fast file lookups."
  },
  "find_by_name": {
    alternative: "webstorm-mcp find_files_by_name_keyword or everything-search",
    skillRef: "/webstorm-mcp or /everything-search",
    message: "Native find_by_name is banned. Use WebStorm MCP or everything-search."
  },
  "grep_search": {
    alternative: "codebase-memory-mcp search_code, webstorm-mcp search_in_files_by_regex, or ripgrep",
    skillRef: "/codebase-memory-mcp, /webstorm-mcp, or /ripgrep",
    message: "Native grep_search is banned. Use codebase-memory-mcp, webstorm-mcp, or ripgrep via PowerShell."
  }
};

async function main() {
  const args = process.argv.slice(2);
  // Example usage: bun run pre-tool-use.ts <tool_name>
  // Sometimes hooks might pass JSON string containing { "tool": "name" }
  let toolName = args[0] || "";
  
  if (toolName.startsWith("{")) {
    try {
      const payload = JSON.parse(toolName);
      toolName = payload.tool || payload.name || toolName;
    } catch {}
  }

  // Handle run_command separately if needed, to block bash explicitly
  if (toolName === "run_command") {
    // If we could check args we would, but simply warning might be enough
    // For now, allow run_command as it's needed for PowerShell
  }

  if (bannedToolsMap[toolName]) {
    const info = bannedToolsMap[toolName];
    const reason = `Tool '${toolName}' is banned by workspace policy.\nAlternative: ${info?.alternative}\nSkill Reference: ${info?.skillRef}\nReason: ${info?.message}`;
    
    console.log(JSON.stringify({
      decision: "deny",
      reason: reason
    }));
    process.exit(0);
  }

  // Allowed tool
  console.log(JSON.stringify({
    decision: "allow"
  }));
  process.exit(0);
}

main().catch(err => {
  console.log(JSON.stringify({
    decision: "deny",
    reason: `Hook execution error: ${err instanceof Error ? err.message : String(err)}`
  }));
  process.exit(0);
});
