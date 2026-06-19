---
description: Explains how to use the SARA CLI to manage requirements and validate design traceability.
name: sara-cli
---

# SARA CLI Skill Guide

SARA is a Requirements and Design Traceability CLI tool used within this workspace. It manages system and software requirements, ensuring they trace correctly to design files and implementation code.

> [!IMPORTANT]
> Within this workspace, prefix your `sara` commands with `rtk` (e.g., `rtk sara check`) to compress its output and conserve the token budget.

## Table of Contents

- [Validation and Integrity](#validation-and-integrity)
  - [Check Graph Integrity](#check-graph-integrity)
- [Reporting](#reporting)
  - [Generate Coverage Report](#generate-coverage-report)

## Validation and Integrity

### Check Graph Integrity
Validates the requirements and design graph. This ensures that all requirements trace correctly to design files and implementations, and that there are no broken links or missing traces.
**Example Usage:**
```bash
rtk sara check
```

## Reporting

### Generate Coverage Report
Generates a coverage report detailing the traceability from requirements down to the implementation layer.
**Example Usage:**
```bash
rtk sara report
``

## CLI Help Reference




```text
CLI for Sara - Requirements data graph

Usage: sara.exe [OPTIONS] <COMMAND>

Commands:
  check   Parse documents, build data graph, and validate integrity
  diff    Compare graphs between Git references
  edit    Edit existing document metadata by item ID (interactive mode if no flags provided)
  init    Initialize metadata in a Markdown file
  query   Query items and traceability chains
  report  Generate coverage and traceability reports
  schema  Export the active model schema as YAML

Global Options:
  -c, --config <CONFIG>          Path to configuration file [default: sara.toml]
  -h, --help                     Print help
      --no-color                 Disable colored output
      --no-emoji                 Disable emoji output
  -q, --quiet                    Suppress all output except errors
  -v, --verbose...               Increase verbosity (-v, -vv, -vvv)
  -r, --repository <REPOSITORY>  Additional repository paths
  -V, --version                  Print version

```

