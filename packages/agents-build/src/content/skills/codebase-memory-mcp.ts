/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const codebaseMemoryMcp = defineSkill({
  content: [
    {
      level: 1,
      text: "Codebase Memory Graph (codebase-memory-mcp) Skill Guide",
      type: "header"
    },
    {
      text: "The `codebase-memory-mcp` server maintains a comprehensive data graph of the workspace's architecture, dependencies, and implementations.",
      type: "text"
    },
    {
      text: "[!IMPORTANT]\n**ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.** Use tools like `search_graph`, `trace_path`, and `get_code_snippet` for structural and semantic lookups. Fall back to text search only for string literals, configuration values, or non-code files.",
      type: "quote"
    },
    {
      level: 2,
      text: "Available Tools",
      type: "header"
    },
    {
      level: 3,
      text: "index_repository",
      type: "header"
    },
    {
      text: "Index a repository into the data graph. Special mode 'cross-repo-intelligence': skip extraction, only match Routes/Channels across projects to create CROSS_HTTP_CALLS/CROSS_ASYNC_CALLS/CROSS_CHANNEL edges. Requires target_projects param. Ensure target projects have fresh indexes first.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`mode`** `[string]`: All modes run type-aware LSP call/usage resolution (per-file + cross-file). full: all files + similarity/semantic edges. moderate: filtered files + similarity/semantic. fast: filtered files, no similarity/semantic. cross-repo-intelligence: match Routes/Channels across projects."
        },
        {
          text: "**`persistence`** `[boolean]`: Write compressed artifact to .codebase-memory/graph.db.zst for team sharing. Teammates can bootstrap from the artifact instead of full re-indexing."
        },
        {
          text: "**`repo_path`** `[string]` (Required): Path to the repository"
        },
        {
          text: '**`target_projects`** `[array]`: Projects to search for cross-repo links (cross-repo-intelligence mode). Use ["*"] for all indexed projects. Run list_projects to see available projects.'
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "search_graph",
      type: "header"
    },
    {
      text: "Search the code data graph for functions, classes, routes, and variables. Use INSTEAD OF grep/glob when finding code definitions, implementations, or relationships. Three search modes: (1) query='update settings' for BM25 ranked full-text search with camelCase splitting and structural label boosting — recommended for natural-language discovery; (2) name_pattern='.*regex.*' for exact pattern matching; (3) semantic_query=[...] for vector cosine search that bridges vocabulary (finds 'publish' when you search 'send'). The three modes are independent and can be combined in a single call. PAGINATION: results are capped at limit (default 200) — broader queries are silently truncated. The response always includes 'total' (full match count before limit) and 'has_more' (true when total > offset+returned). Detect truncation with has_more, then page by re-calling with offset=offset+limit until has_more is false. Narrow first via label/file_pattern/min_degree before paginating large result sets.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`exclude_entry_points`** `[boolean]`: No description provided."
        },
        {
          text: "**`file_pattern`** `[string]`: No description provided."
        },
        {
          text: "**`include_connected`** `[boolean]`: No description provided."
        },
        {
          text: "**`label`** `[string]`: No description provided."
        },
        {
          text: "**`limit`** `[integer]`: Max results per call. Default 200. Response carries 'total' (full match count) and 'has_more' (true if truncated) so callers can detect the limit and paginate."
        },
        {
          text: "**`max_degree`** `[integer]`: No description provided."
        },
        {
          text: "**`min_degree`** `[integer]`: No description provided."
        },
        {
          text: "**`name_pattern`** `[string]`: No description provided."
        },
        {
          text: "**`offset`** `[integer]`: Skip the first N matching nodes. Combine with 'limit' to page: increment offset by limit and re-call while has_more is true."
        },
        {
          text: "**`project`** `[string]` (Required): No description provided."
        },
        {
          text: "**`qn_pattern`** `[string]`: No description provided."
        },
        {
          text: "**`query`** `[string]`: Natural-language or keyword full-text search using BM25 ranking. Tokens are split on whitespace; camelCase identifiers are indexed as individual words (updateCloudClient → update, cloud, client). Results are ranked with structural boosting: Functions/Methods +10, Routes +8, Classes/Interfaces +5. Noise labels (File/Folder/Module/Variable) are filtered out. When provided, name_pattern is ignored."
        },
        {
          text: "**`relationship`** `[string]`: No description provided."
        },
        {
          text: '**`semantic_query`** `[array]`: MUST be an ARRAY of keyword strings (e.g. ["send","pubsub","publish"]) — NOT a single string. Each keyword is scored independently via per-keyword min-cosine; results reflect functions that score well on ALL keywords. Requires moderate/full index mode. Results appear in the \'semantic_results\' field (separate from \'results\').'
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "query_graph",
      type: "header"
    },
    {
      text: "Execute a Cypher query against the data graph for complex multi-hop patterns, aggregations, and cross-service analysis. The response includes 'total' (returned row count). There is a hard 100k row ceiling — for broad queries add LIMIT in the Cypher itself or use search_graph + offset/limit pagination instead. COMPLEXITY / BOTTLENECKS: every Function and Method node carries queryable complexity properties — cyclomatic (complexity), cognitive, loop_count, loop_depth (max nested-loop depth, a polynomial-degree proxy), plus interprocedural transitive_loop_depth (worst-case nested-loop degree propagated along CALLS edges) and a recursive flag. Additional hot-path signals: linear_scan_in_loop (count of find/contains/indexOf-style scans inside a loop — the hidden O(n^2) that loop_depth misses), alloc_in_loop (allocations/appends inside a loop), recursion_in_loop (a self-call inside a loop), unguarded_recursion (recursion with no conditionally-guarded base case), param_count and max_access_depth (structure smells). Find all hot-path candidates in one query, e.g. MATCH (f:Function) WHERE f.transitive_loop_depth >= 3 OR f.linear_scan_in_loop >= 1 RETURN f.qualified_name, f.transitive_loop_depth, f.linear_scan_in_loop ORDER BY f.transitive_loop_depth DESC.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`max_rows`** `[integer]`: Optional row limit. Default: unlimited up to a 100k row ceiling. No offset support — use search_graph for paginated browsing."
        },
        {
          text: "**`project`** `[string]` (Required): No description provided."
        },
        {
          text: "**`query`** `[string]` (Required): Cypher query"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "trace_path",
      type: "header"
    },
    {
      text: "Trace paths through the code graph. Modes: calls (callers/callees), data_flow (value propagation with args at each hop), cross_service (through HTTP/async Route nodes). Use INSTEAD OF grep for callers, dependencies, impact analysis, or data flow tracing.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`depth`** `[integer]`: No description provided."
        },
        {
          text: "**`direction`** `[string]`: No description provided."
        },
        {
          text: "**`edge_types`** `[array]`: No description provided."
        },
        {
          text: "**`function_name`** `[string]` (Required): No description provided."
        },
        {
          text: "**`include_tests`** `[boolean]`: Include test files in results. When false (default), test files are filtered out. When true, test nodes are included with is_test=true marker."
        },
        {
          text: "**`mode`** `[string]`: calls: follow CALLS edges. data_flow: follow CALLS+DATA_FLOWS with arg expressions. cross_service: follow HTTP_CALLS+ASYNC_CALLS+DATA_FLOWS through Routes."
        },
        {
          text: "**`parameter_name`** `[string]`: For data_flow mode: scope trace to a specific parameter name"
        },
        {
          text: "**`project`** `[string]` (Required): No description provided."
        },
        {
          text: "**`risk_labels`** `[boolean]`: Add risk classification (CRITICAL/HIGH/MEDIUM/LOW) based on hop distance"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "get_code_snippet",
      type: "header"
    },
    {
      text: "Read source code for a function/class/symbol. IMPORTANT: First call search_graph to find the exact qualified_name, then pass it here. This is a read tool, not a search tool. Accepts full qualified_name (exact match) or short function name (returns suggestions if ambiguous).",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`include_neighbors`** `[boolean]`: No description provided."
        },
        {
          text: "**`project`** `[string]` (Required): No description provided."
        },
        {
          text: "**`qualified_name`** `[string]` (Required): Full qualified_name from search_graph, or short function name"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "get_graph_schema",
      type: "header"
    },
    {
      text: "Get the schema of the data graph (node labels, edge types)",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`project`** `[string]` (Required): No description provided."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "get_architecture",
      type: "header"
    },
    {
      text: "Get high-level architecture overview — packages, services, dependencies, and project structure at a glance. Includes 'clusters': Leiden community detection over the call/import graph, surfacing the de-facto modules (each with a label, member count, cohesion score, representative top_nodes, and the packages/edge_types that bind it) — use these to grasp the real architectural seams, which often cut across the folder layout.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`aspects`** `[array]`: No description provided."
        },
        {
          text: "**`project`** `[string]` (Required): No description provided."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "search_code",
      type: "header"
    },
    {
      text: "Graph-augmented code search. Finds text patterns via grep, then enriches results with the data graph: deduplicates matches into containing functions, ranks by structural importance (definitions first, popular functions next, tests last). Modes: compact (default, signatures only — token efficient), full (with source), files (just file paths). Use path_filter regex to scope results. TRUNCATION: enriched results are capped at limit (default 10). Response carries 'total_grep_matches' (raw grep hit count) and 'total_results' (deduplicated function count) — compare to limit to detect truncation. There is no offset parameter; to see more, raise limit or narrow the query with file_pattern / path_filter.",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`context`** `[integer]`: Lines of context around each match (like grep -C). Only used in compact mode."
        },
        {
          text: "**`file_pattern`** `[string]`: Glob for grep --include (e.g. *.go)"
        },
        {
          text: "**`limit`** `[integer]`: Max enriched results per call. Default 10. Response includes 'total_grep_matches' and 'total_results' so callers can detect truncation. No offset parameter — raise limit or narrow with file_pattern / path_filter to see more."
        },
        {
          text: "**`mode`** `[string]`: compact: signatures+metadata (default). full: with source. files: just file list."
        },
        {
          text: "**`path_filter`** `[string]`: Regex filter on result file paths (e.g. ^src/ or \\.(go|ts)$)"
        },
        {
          text: "**`pattern`** `[string]` (Required): No description provided."
        },
        {
          text: "**`project`** `[string]` (Required): No description provided."
        },
        {
          text: "**`regex`** `[boolean]`: No description provided."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "list_projects",
      type: "header"
    },
    {
      text: "List all indexed projects",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "*No parameters required.*"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "delete_project",
      type: "header"
    },
    {
      text: "Delete a project from the index",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`project`** `[string]` (Required): No description provided."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "index_status",
      type: "header"
    },
    {
      text: "Get the indexing status of a project",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`project`** `[string]` (Required): No description provided."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "detect_changes",
      type: "header"
    },
    {
      text: "Detect code changes and their impact",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`base_branch`** `[string]`: No description provided."
        },
        {
          text: "**`depth`** `[integer]`: No description provided."
        },
        {
          text: "**`project`** `[string]` (Required): No description provided."
        },
        {
          text: "**`scope`** `[string]`: No description provided."
        },
        {
          text: "**`since`** `[string]`: Git ref or date to compare from (e.g. HEAD~5, v0.5.0, 2026-01-01)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "manage_adr",
      type: "header"
    },
    {
      text: "Create or update Architecture Decision Records",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`content`** `[string]`: No description provided."
        },
        {
          text: "**`mode`** `[string]`: No description provided."
        },
        {
          text: "**`project`** `[string]` (Required): No description provided."
        },
        {
          text: "**`sections`** `[array]`: No description provided."
        }
      ],
      type: "unorderedList"
    },
    {
      level: 3,
      text: "ingest_traces",
      type: "header"
    },
    {
      text: "Ingest runtime traces to enhance the data graph",
      type: "text"
    },
    {
      text: "**Parameters:**",
      type: "text"
    },
    {
      items: [
        {
          text: "**`project`** `[string]` (Required): No description provided."
        },
        {
          text: "**`traces`** `[array]` (Required): No description provided."
        }
      ],
      type: "unorderedList"
    }
  ] as MarkdownBlock[],
  description:
    "Explains how to use the codebase-memory-mcp server to discover code, trace execution paths, and query the workspace architecture data graph.",
  name: "codebase-memory-mcp"
});
