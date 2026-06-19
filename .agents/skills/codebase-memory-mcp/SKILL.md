---
description: Explains how to use the codebase-memory-mcp server to discover code, trace execution paths, and query the workspace architecture data graph.
name: codebase-memory-mcp
---

# Codebase Memory Graph (codebase-memory-mcp) Skill Guide

The `codebase-memory-mcp` server maintains a comprehensive data graph of the workspace's architecture, dependencies, and implementations.

> [!IMPORTANT]
> **ALWAYS prefer MCP graph tools over grep/glob/file-search for code discovery.** Use tools like `search_graph`, `trace_path`, and `get_code_snippet` for structural and semantic lookups. Fall back to text search only for string literals, configuration values, or non-code files.

## Available Tools

### index_repository

Index a repository into the data graph. Special mode 'cross-repo-intelligence': skip extraction, only match Routes/Channels across projects to create CROSS_HTTP_CALLS/CROSS_ASYNC_CALLS/CROSS_CHANNEL edges. Requires target_projects param. Ensure target projects have fresh indexes first.

**Parameters:**

* **`mode`** `[string]`: All modes run type-aware LSP call/usage resolution (per-file + cross-file). full: all files + similarity/semantic edges. moderate: filtered files + similarity/semantic. fast: filtered files, no similarity/semantic. cross-repo-intelligence: match Routes/Channels across projects.
* **`persistence`** `[boolean]`: Write compressed artifact to .codebase-memory/graph.db.zst for team sharing. Teammates can bootstrap from the artifact instead of full re-indexing.
* **`repo_path`** `[string]` (Required): Path to the repository
* **`target_projects`** `[array]`: Projects to search for cross-repo links (cross-repo-intelligence mode). Use ["*"] for all indexed projects. Run list_projects to see available projects.

### search_graph

Search the code data graph for functions, classes, routes, and variables. Use INSTEAD OF grep/glob when finding code definitions, implementations, or relationships. Three search modes: (1) query='update settings' for BM25 ranked full-text search with camelCase splitting and structural label boosting — recommended for natural-language discovery; (2) name_pattern='.*regex.*' for exact pattern matching; (3) semantic_query=[...] for vector cosine search that bridges vocabulary (finds 'publish' when you search 'send'). The three modes are independent and can be combined in a single call. PAGINATION: results are capped at limit (default 200) — broader queries are silently truncated. The response always includes 'total' (full match count before limit) and 'has_more' (true when total > offset+returned). Detect truncation with has_more, then page by re-calling with offset=offset+limit until has_more is false. Narrow first via label/file_pattern/min_degree before paginating large result sets.

**Parameters:**

* **`exclude_entry_points`** `[boolean]`: No description provided.
* **`file_pattern`** `[string]`: No description provided.
* **`include_connected`** `[boolean]`: No description provided.
* **`label`** `[string]`: No description provided.
* **`limit`** `[integer]`: Max results per call. Default 200. Response carries 'total' (full match count) and 'has_more' (true if truncated) so callers can detect the limit and paginate.
* **`max_degree`** `[integer]`: No description provided.
* **`min_degree`** `[integer]`: No description provided.
* **`name_pattern`** `[string]`: No description provided.
* **`offset`** `[integer]`: Skip the first N matching nodes. Combine with 'limit' to page: increment offset by limit and re-call while has_more is true.
* **`project`** `[string]` (Required): No description provided.
* **`qn_pattern`** `[string]`: No description provided.
* **`query`** `[string]`: Natural-language or keyword full-text search using BM25 ranking. Tokens are split on whitespace; camelCase identifiers are indexed as individual words (updateCloudClient → update, cloud, client). Results are ranked with structural boosting: Functions/Methods +10, Routes +8, Classes/Interfaces +5. Noise labels (File/Folder/Module/Variable) are filtered out. When provided, name_pattern is ignored.
* **`relationship`** `[string]`: No description provided.
* **`semantic_query`** `[array]`: MUST be an ARRAY of keyword strings (e.g. ["send","pubsub","publish"]) — NOT a single string. Each keyword is scored independently via per-keyword min-cosine; results reflect functions that score well on ALL keywords. Requires moderate/full index mode. Results appear in the 'semantic_results' field (separate from 'results').

### query_graph

Execute a Cypher query against the data graph for complex multi-hop patterns, aggregations, and cross-service analysis. The response includes 'total' (returned row count). There is a hard 100k row ceiling — for broad queries add LIMIT in the Cypher itself or use search_graph + offset/limit pagination instead. COMPLEXITY / BOTTLENECKS: every Function and Method node carries queryable complexity properties — cyclomatic (complexity), cognitive, loop_count, loop_depth (max nested-loop depth, a polynomial-degree proxy), plus interprocedural transitive_loop_depth (worst-case nested-loop degree propagated along CALLS edges) and a recursive flag. Additional hot-path signals: linear_scan_in_loop (count of find/contains/indexOf-style scans inside a loop — the hidden O(n^2) that loop_depth misses), alloc_in_loop (allocations/appends inside a loop), recursion_in_loop (a self-call inside a loop), unguarded_recursion (recursion with no conditionally-guarded base case), param_count and max_access_depth (structure smells). Find all hot-path candidates in one query, e.g. MATCH (f:Function) WHERE f.transitive_loop_depth >= 3 OR f.linear_scan_in_loop >= 1 RETURN f.qualified_name, f.transitive_loop_depth, f.linear_scan_in_loop ORDER BY f.transitive_loop_depth DESC.

**Parameters:**

* **`max_rows`** `[integer]`: Optional row limit. Default: unlimited up to a 100k row ceiling. No offset support — use search_graph for paginated browsing.
* **`project`** `[string]` (Required): No description provided.
* **`query`** `[string]` (Required): Cypher query

### trace_path

Trace paths through the code graph. Modes: calls (callers/callees), data_flow (value propagation with args at each hop), cross_service (through HTTP/async Route nodes). Use INSTEAD OF grep for callers, dependencies, impact analysis, or data flow tracing.

**Parameters:**

* **`depth`** `[integer]`: No description provided.
* **`direction`** `[string]`: No description provided.
* **`edge_types`** `[array]`: No description provided.
* **`function_name`** `[string]` (Required): No description provided.
* **`include_tests`** `[boolean]`: Include test files in results. When false (default), test files are filtered out. When true, test nodes are included with is_test=true marker.
* **`mode`** `[string]`: calls: follow CALLS edges. data_flow: follow CALLS+DATA_FLOWS with arg expressions. cross_service: follow HTTP_CALLS+ASYNC_CALLS+DATA_FLOWS through Routes.
* **`parameter_name`** `[string]`: For data_flow mode: scope trace to a specific parameter name
* **`project`** `[string]` (Required): No description provided.
* **`risk_labels`** `[boolean]`: Add risk classification (CRITICAL/HIGH/MEDIUM/LOW) based on hop distance

### get_code_snippet

Read source code for a function/class/symbol. IMPORTANT: First call search_graph to find the exact qualified_name, then pass it here. This is a read tool, not a search tool. Accepts full qualified_name (exact match) or short function name (returns suggestions if ambiguous).

**Parameters:**

* **`include_neighbors`** `[boolean]`: No description provided.
* **`project`** `[string]` (Required): No description provided.
* **`qualified_name`** `[string]` (Required): Full qualified_name from search_graph, or short function name

### get_graph_schema

Get the schema of the data graph (node labels, edge types)

**Parameters:**

* **`project`** `[string]` (Required): No description provided.

### get_architecture

Get high-level architecture overview — packages, services, dependencies, and project structure at a glance. Includes 'clusters': Leiden community detection over the call/import graph, surfacing the de-facto modules (each with a label, member count, cohesion score, representative top_nodes, and the packages/edge_types that bind it) — use these to grasp the real architectural seams, which often cut across the folder layout.

**Parameters:**

* **`aspects`** `[array]`: No description provided.
* **`project`** `[string]` (Required): No description provided.

### search_code

Graph-augmented code search. Finds text patterns via grep, then enriches results with the data graph: deduplicates matches into containing functions, ranks by structural importance (definitions first, popular functions next, tests last). Modes: compact (default, signatures only — token efficient), full (with source), files (just file paths). Use path_filter regex to scope results. TRUNCATION: enriched results are capped at limit (default 10). Response carries 'total_grep_matches' (raw grep hit count) and 'total_results' (deduplicated function count) — compare to limit to detect truncation. There is no offset parameter; to see more, raise limit or narrow the query with file_pattern / path_filter.

**Parameters:**

* **`context`** `[integer]`: Lines of context around each match (like grep -C). Only used in compact mode.
* **`file_pattern`** `[string]`: Glob for grep --include (e.g. *.go)
* **`limit`** `[integer]`: Max enriched results per call. Default 10. Response includes 'total_grep_matches' and 'total_results' so callers can detect truncation. No offset parameter — raise limit or narrow with file_pattern / path_filter to see more.
* **`mode`** `[string]`: compact: signatures+metadata (default). full: with source. files: just file list.
* **`path_filter`** `[string]`: Regex filter on result file paths (e.g. ^src/ or \.(go|ts)$)
* **`pattern`** `[string]` (Required): No description provided.
* **`project`** `[string]` (Required): No description provided.
* **`regex`** `[boolean]`: No description provided.

### list_projects

List all indexed projects

**Parameters:**

* *No parameters required.*

### delete_project

Delete a project from the index

**Parameters:**

* **`project`** `[string]` (Required): No description provided.

### index_status

Get the indexing status of a project

**Parameters:**

* **`project`** `[string]` (Required): No description provided.

### detect_changes

Detect code changes and their impact

**Parameters:**

* **`base_branch`** `[string]`: No description provided.
* **`depth`** `[integer]`: No description provided.
* **`project`** `[string]` (Required): No description provided.
* **`scope`** `[string]`: No description provided.
* **`since`** `[string]`: Git ref or date to compare from (e.g. HEAD~5, v0.5.0, 2026-01-01)

### manage_adr

Create or update Architecture Decision Records

**Parameters:**

* **`content`** `[string]`: No description provided.
* **`mode`** `[string]`: No description provided.
* **`project`** `[string]` (Required): No description provided.
* **`sections`** `[array]`: No description provided.

### ingest_traces

Ingest runtime traces to enhance the data graph

**Parameters:**

* **`project`** `[string]` (Required): No description provided.
* **`traces`** `[array]` (Required): No description provided.
