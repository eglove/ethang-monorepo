---
description: reviewing React component design, Hono/Cloudflare Worker routes, Drizzle database queries, or general architecture quality
trigger: model_decision
---

# Atomic Design Principles

## 1. Domain Theory and Conceptual Foundations
Brad Frost's Atomic Design is a hierarchical framework for creating modular, consistent, and reusable design systems. Analagous to chemistry, it models interfaces as hierarchical combinations of components:
- **Atoms**: HTML tags or custom design primitives (buttons, inputs, labels, status badges, icons) that cannot be broken down further. They are stateless and decoupled from business context.
- **Molecules**: Simple groups of UI components functioning as a single unit (e.g., a search form molecule composed of a label, input, and button). Molecules manage minimal local UI state but remain presentational.
- **Organisms**: Complex UI structures composed of molecules and/or atoms. They form functional sections of an interface (e.g., navigation headers, product grids, sidebar menus) and tie components to domain contexts.
- **Templates**: Page-level layout abstractions that position components within flexbox or grid container slots. Templates focus on structural hierarchy and responsive layout boundaries rather than real data.
- **Pages**: Instances of templates rendering real data, handling API states, and managing routing. Pages bind global context providers and orchestrate container state transitions.

### 1.1 State Management and Component Coupling
As components ascend the Atomic Design hierarchy, they transition from presentational (stateless) to container (stateful) interfaces:
- **Stateless Presentational Layer (Atoms and Molecules)**: These must be pure, stateless, and completely decoupled from global state, network queries, or routing. They receive all data and callback handlers via props.
- **Stateful Container Layer (Organisms and Pages)**: These manage side-effects, integrate with API clients, and bind to routing contexts. They fetch data and map the results into presentational props for nested child elements.

### 1.2 Design Systems and Visual Consistency
A design system serves as a single source of truth for visual languages and component behaviors. Organizing the system using Atomic Design protects visual consistency, de-duplicates styling efforts, and enables visual updates to propagate automatically from style primitives.

### 1.3 Workspace Directory Structure and Governance
To prevent design boundaries from decaying over time, components must be organized in matching folders within the codebase structure. This visual and architectural alignment enforces modular thinking during creation and reviews:
```
src/
  components/
    atoms/
      Button.tsx
      Input.tsx
    molecules/
      SearchInput.tsx
      FormField.tsx
    organisms/
      NavigationHeader.tsx
      DashboardStatsGrid.tsx
    templates/
      AppLayout.tsx
    pages/
      DashboardPage.tsx
```

## 2. Standard Operating Procedures (SOP)

### Step 2.1: Defining CSS-Variable-Based Design Tokens
Define all style primitives using CSS custom properties in a global stylesheet to ensure a single source of truth for visual tokens:
```css
:root {
  --color-brand-primary: #1e3a8a;
  --color-brand-hover: #1d4ed8;
  --font-sans: "Inter", sans-serif;
  --spacing-unit-sm: 8px;
  --spacing-unit-md: 16px;
  --spacing-unit-lg: 24px;
}
```

### Step 2.2: Implementing Stateless Presentational Atoms
Atoms must be highly reusable, purely presentational, and declare explicit TypeScript interfaces with readonly properties. Rely on type inference rather than explicit return types:
```typescript
import React from "react";

export interface ButtonProps {
  readonly label: string;
  readonly onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
}

export const Button = ({ label, onClick, disabled = false }: ButtonProps) => {
  return (
    <button className="atom-button" onClick={onClick} disabled={disabled} type="button">
      {label}
    </button>
  );
};
```

### Step 2.3: Bonding Atoms into Presentational Molecules
Molecules combine atoms into simple functional groups. They must remain presentational and handle only local UI states (e.g., text inputs, toggle selections):
```typescript
import React, { useState } from "react";
import { Button } from "./Button.tsx";

export interface SearchInputProps {
  readonly onSearchSubmit: (query: string) => void;
  readonly placeholderText?: string;
}

export const SearchInput = ({ onSearchSubmit, placeholderText = "Search..." }: SearchInputProps) => {
  const [query, setQuery] = useState("");
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(query);
  };

  return (
    <form className="molecule-search-input" onSubmit={handleSubmit}>
      <input type="text" value={query} onChange={handleChange} placeholder={placeholderText} />
      <Button label="Go" onClick={() => {}} />
    </form>
  );
};
```

### Step 2.4: Building Contextual Organisms
Organisms coordinate custom interactions, consume state hooks or queries, and map data parameters into presentational props:
```typescript
import React from "react";
import { SearchInput } from "../molecules/SearchInput.tsx";
import { useSearchQuery } from "../../hooks/useSearchQuery.ts";

export const NavigationHeader = () => {
  const { triggerSearch, isPending } = useSearchQuery();
  const handleSearch = (query: string) => {
    triggerSearch(query);
  };

  return (
    <header className="organism-nav-header">
      <div className="nav-logo">Dashboard</div>
      <SearchInput onSearchSubmit={handleSearch} />
      {isPending && <span className="search-spinner">Searching...</span>}
    </header>
  );
};
```

### Step 2.5: Formatting Structural Templates
Templates define layout placement slots. They must accept nested elements as React nodes or child slots, remaining decoupled from domain data:
```typescript
import React from "react";

export interface AppLayoutProps {
  readonly headerSlot: React.ReactNode;
  readonly sidebarSlot: React.ReactNode;
  readonly mainContentSlot: React.ReactNode;
}

export const AppLayout = ({ headerSlot, sidebarSlot, mainContentSlot }: AppLayoutProps) => {
  return (
    <div className="template-app-layout">
      <div className="layout-header">{headerSlot}</div>
      <div className="layout-body">
        <aside className="layout-sidebar">{sidebarSlot}</aside>
        <main className="layout-content">{mainContentSlot}</main>
      </div>
    </div>
  );
};
```

### Step 2.6: Orchestrating Pages
Pages represent the top-level boundary. They handle routing parameters, state context providers, and populate template slots with organisms:
```typescript
import React from "react";
import { AppLayout } from "../templates/AppLayout.tsx";
import { NavigationHeader } from "../organisms/NavigationHeader.tsx";
import { NavigationSidebar } from "../organisms/NavigationSidebar.tsx";
import { DashboardStatsGrid } from "../organisms/DashboardStatsGrid.tsx";

export const DashboardPage = () => {
  return (
    <AppLayout
      headerSlot={<NavigationHeader />}
      sidebarSlot={<NavigationSidebar />}
      mainContentSlot={<DashboardStatsGrid />}
    />
  );
};
```

### Step 2.7: Verifying the Component System
Verify changes locally before submission to guarantee zero typescript and compilation regressions:
```bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following frontend component design rules:

- [ ] **Atoms Stateless**: Are all atoms completely stateless and decoupled from API calls or global contexts?
- [ ] **Molecules Presentational**: Do molecules manage only transient UI state rather than application business logic?
- [ ] **Templates Decoupled**: Are templates free of direct organism or page rendering, accepting components via layout slots?
- [ ] **Prop Interface Immutability**: Are all TypeScript prop interfaces defined using the `readonly` modifier?
- [ ] **Named Exports Enforced**: Are all component definitions exported via named exports to protect refactoring pathways?
- [ ] **No Hardcoded Styles**: Are layout coordinates and design styles linked directly to design token CSS variables?
- [ ] **Implicit Return Types**: Do React components and helper hooks rely on TypeScript type inference rather than declaring explicit return types?
- [ ] **Arrow Function Syntax**: Are all components and callback handlers written as arrow functions?
- [ ] **Access Modifiers Declared**: Are all classes and object methods annotated with explicit accessibility modifiers (`public`/`private`/`protected`)?
- [ ] **Luxon for Timestamps**: Are times and dates parsed and formatted using Luxon (`DateTime`) rather than the native JavaScript Date object?
- [ ] **No Forbidden Terminology**: Has the file content been scanned to ensure no forbidden words are used?
- [ ] **Index Signature Property Access**: Are dynamic index-signature object attributes accessed via bracket notation (`obj["prop"]`)?
- [ ] **Explicit Tuple Typing**: Are Vitest `it.each` tables explicitly typed as tuples to prevent compilation mismatches?
- [ ] **Void Assertions Wrapped**: Are test cases checking that void methods don't throw wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Rule Character Bounds**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Backticks Properly Escaped**: Are all code blocks and inline backticks within rule template strings double-escaped or backslash-escaped?
- [ ] **Red-Green TDD Loop**: Were testing scripts written and executed before modifications to ensure code-change safety?
- [ ] **Walkthrough Updated**: Are UI updates, component mock tests, and lint reports documented in `walkthrough.md`?
- [ ] **Reducers Side-Effect Free**: Are all state machines and state reducer functions pure and decoupled from async triggers?
- [ ] **Error Boundaries Utilized**: Are page-level boundaries wrapped in functional React ErrorBoundary blocks to isolate component exceptions?
