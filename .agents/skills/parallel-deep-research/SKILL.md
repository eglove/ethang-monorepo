---
name: parallel-deep-research
description: >
  Produces comprehensive research reports that go far beyond what built-in web
  search can achieve. Sends research tasks to Parallel AI's pro/ultra processors
  which spend 3-25 minutes autonomously crawling, reading, and synthesizing dozens
  of sources — returning structured reports with citations. Built-in WebSearch
  can only run a few queries; this skill runs an entire research pipeline externally.
  No binary install — requires PARALLEL_API_KEY in .env.local. ALWAYS use this
  skill instead of doing multiple WebSearch calls when the user needs a comprehensive
  report, market analysis, competitive landscape, industry deep-dive, strategic
  recommendations, or multi-source synthesis. This is the RIGHT tool for any
  research task that would require more than 3-4 web searches to answer properly.
  Also trigger during /plan Phase 2 research and /research workflows.
compatibility: Requires PARALLEL_API_KEY in .env.local. Uses curl. Takes 3-25 minutes.
metadata:
  author: harshanandak
  version: "1.0.0"
---

# Parallel Deep Research

Comprehensive research reports with multi-source synthesis. Use `pro` (3-9 min, $0.10) or `ultra` (5-25 min, $0.30) for deep analysis.

> **CLI alternative (recommended)**: Install `parallel-cli` for official skill:
> `npx skills add parallel-web/parallel-agent-skills --skill parallel-deep-research`

## Setup

```bash
API_KEY=$(grep "^PARALLEL_API_KEY=" .env.local | cut -d= -f2)
```

## Create Research Task

```bash
curl -s -X POST "https://api.parallel.ai/v1/tasks/runs" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Analyze the AI chatbot market. Include: size, growth, key players, trends, competitive threats",
    "processor": "pro"
  }'
```

Response: `{"run_id": "trun_abc123...", "status": "queued"}`

## Get Result (polling)

The result endpoint returns both status and output in one call. Poll until `status` is `completed`.

```bash
RUN_ID="trun_abc123..."
MAX_POLLS=180  # 30 min max (180 × 10s)

for i in $(seq 1 $MAX_POLLS); do
  RESULT=$(curl -s "https://api.parallel.ai/v1/tasks/runs/$RUN_ID/result" \
    -H "x-api-key: $API_KEY")

  STATUS=$(echo "$RESULT" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ "$STATUS" = "completed" ]; then
    echo "$RESULT"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Task failed: $RESULT"
    break
  fi

  echo "Poll $i/$MAX_POLLS — Status: $STATUS"
  sleep 10
done

if [ "$i" = "$MAX_POLLS" ] && [ "$STATUS" != "completed" ] && [ "$STATUS" != "failed" ]; then
  echo "Timeout: task did not complete within 30 minutes"
fi
```

## Processors

| Processor | Speed | Cost | Use For |
|-----------|-------|------|---------|
| pro | 3-9 min | $0.10/task | Market analysis, strategic reports |
| ultra | 5-25 min | $0.30/task | Comprehensive deep research |

## Example: Market Analysis

```json
{
  "input": "Analyze the AI chip market in 2024. Include market size, growth rate, key players (NVIDIA, AMD, Intel), emerging competitors, and 2025 outlook.",
  "processor": "pro"
}
```

Result: Markdown report with citations.

## When to Use

- Market research and competitive analysis
- Strategic reports requiring multiple sources
- Research that needs synthesis across many documents
- Any task that would need more than 3-4 web searches to answer properly

For quick facts or single-source lookups, use built-in WebSearch instead.

## Timeout

Set polling timeout to 1800s (30 min) for ultra tasks. Pro tasks typically complete in 3-9 min.
