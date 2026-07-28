---
tags: [backlog, app, game, modding]
status: todo
priority: low
created: 2026-07-26
---

# Game Modlist Builder App

## Goal

Build a web application for building game mod lists. Users search for mods. Users add the mods to a list. The system resolves requirements, conflicts, and patches.

## Core Features

### Mod Search
- Search across mod databases (Nexus Mods API? ModDB?).
- Display mod metadata: name, version, author, dependencies, conflicts.
- Filter by game, category, popularity.

### Modlist Builder
- Add and remove mods from a list.
- Visual dependency graph.
- Conflict detection and resolution suggestions.
- Patch recommendations.

### Modlist Export
- Export as load order.
- Export as shareable link.
- Version pinning.

## Plan

1. **Research**: Evaluate available mod APIs and data sources.
2. **Data model**: Design the schema for mods, dependencies, conflicts, patches, and modlists.
3. **MVP**: Search and add to list and basic conflict detection.
4. **Graph view**: Visual dependency and conflict graph.
5. **Resolution engine**: Auto-suggest patches and load order.
6. **Export**: Multiple export formats.

## Open Questions

- Which game first? Skyrim? Fallout? Starfield?
- Data source: scrape or API? Nexus Mods has no public API.
- Is this a standalone app or part of the monorepo?
- Do you need auth? You need auth to save and share modlists.

## Tech Stack (proposed)

- TanStack Start (if migration complete — see [[Frontend Migration to TanStack Start-Astryx]])
- D1 or Postgres for data
- D3.js or Cytoscape.js for dependency graphs
