---
name: atomic-design-planning
description: Use this skill when discussing UI components, design systems, frontend implementation, or component architecture. Guides thinking about Atomic Design methodology - atoms, molecules, organisms - and promotes component reuse over creation. Triggers on UI/frontend discussions, "what components do we need?", "should I create a new component?", or design system questions.
---

# Atomic Design Planning Skill

This skill guides UI component architecture using Atomic Design methodology, emphasizing reuse of existing components and proper categorization of new ones.

## When to Use

Apply this skill when:
- Planning UI features or components
- Deciding whether to create new components
- Discussing frontend architecture
- Users ask "what components do we need?"
- Reviewing UI implementation plans
- Discussing design system structure

## Atomic Design Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│  PAGES         - Complete screens with real content     │
├─────────────────────────────────────────────────────────┤
│  TEMPLATES     - Page-level layout structures           │
├─────────────────────────────────────────────────────────┤
│  ORGANISMS     - Complex UI sections (Header, LoginForm)│
├─────────────────────────────────────────────────────────┤
│  MOLECULES     - Simple groups (SearchInput, NavItem)   │
├─────────────────────────────────────────────────────────┤
│  ATOMS         - Basic blocks (Button, Input, Icon)     │
└─────────────────────────────────────────────────────────┘
```

## Component Categories

### Atoms
Smallest, indivisible UI elements: Buttons, Inputs, Labels, Icons, Typography.
- No dependencies on other components
- Highly reusable, controlled by props only

### Molecules
Simple combinations of 2-4 atoms: SearchInput, FormField, NavItem.
- Single responsibility, reusable in multiple organisms

### Organisms
Complex, distinct UI sections: Header, ProductCard, LoginForm, DataTable.
- May connect to data/state, often feature-specific

### Templates
Page-level structural layouts: DashboardLayout, AuthLayout.
- Define content placement, handle responsive behavior

### Pages
Specific instances with real content: HomePage, ProductDetailPage.
- Templates filled with data, route-specific

## The Reuse-First Principle

Before creating ANY component:

1. **Search existing atoms** - Is there a Button/Input that works?
2. **Search existing molecules** - Can a FormField be adapted?
3. **Search existing organisms** - Does a similar Card exist?
4. **Only then create new** - Is this truly unique?

## Decision Table

| Question | If Yes | If No |
|----------|--------|-------|
| Does something similar exist? | Reuse/extend it | Continue evaluation |
| Will this be used in 2+ places? | Consider extracting | Inline it instead |
| Is it truly indivisible? | Make it an atom | Make it a molecule+ |
| Does it combine 2-4 atoms? | Make it a molecule | Make it an organism |
| Is it a complete UI section? | Make it an organism | Reconsider structure |

## Anti-Patterns to Avoid

- **Creating when reusing works** - Configure existing Button with props instead
- **Feature-specific atoms** - "UserProfileButton" should be an organism
- **Skipping levels** - Pages shouldn't directly use atoms
- **Wrong abstraction level** - Atoms shouldn't have business logic

## Integration with Linear Workflow

When planning UI features, create issues for:
1. **Atom issues** - New basic components needed
2. **Molecule issues** - New component combinations
3. **Organism issues** - New feature-level components

Investigation phase should identify existing components to reuse.

Remember: **Reuse existing components. Only create what's truly missing.**
