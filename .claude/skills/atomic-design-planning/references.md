# Atomic Design Planning References

## Foundational Reading

- **Atomic Design** by Brad Frost (https://atomicdesign.bradfrost.com/) - The definitive guide to this methodology
- **Design Systems** by Alla Kholmatova - Building and scaling component libraries
- **Refactoring UI** by Adam Wathan & Steve Schoger - Practical component design patterns

## Brad Frost's Chemistry Metaphor

The naming comes from chemistry:

```
Atoms     → Hydrogen, Oxygen        → Basic UI elements (Button, Input)
Molecules → H₂O                     → Simple compounds (FormField = Label + Input + Error)
Organisms → Cells                   → Complex structures (LoginForm, Header)
Templates → Organ systems           → Page layouts without real content
Pages     → Complete organisms      → Templates with actual data
```

## Related Plugin Commands

| Command/Agent | Purpose |
|---------------|---------|
| `linear-mvp-project-creator` | Identifies existing components during investigation |
| `execute-issue` | Implements components following atomic patterns |
| `/planFeature` | Creates component-aware sub-issues |

## External Resources

- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/chapter-2/)
- [Pattern Lab](https://patternlab.io/) - Tool for building atomic design systems
- [Storybook](https://storybook.js.org/) - Component documentation and testing

## Directory Structure Convention

```
src/
├── components/
│   ├── atoms/
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Icon/
│   ├── molecules/
│   │   ├── SearchInput/
│   │   ├── FormField/
│   │   └── NavItem/
│   ├── organisms/
│   │   ├── Header/
│   │   ├── ProductCard/
│   │   └── LoginForm/
│   └── templates/
│       ├── DashboardLayout/
│       └── AuthLayout/
└── pages/
    ├── Home/
    └── Products/
```

## Component Checklist

Before creating any new component:

```
□ Searched atoms/ directory for similar component
□ Searched molecules/ directory for similar component
□ Searched organisms/ directory for similar component
□ Confirmed no existing component can be extended via props
□ Determined correct level (atom/molecule/organism)
□ Will be reused in 2+ places (justifies extraction)
□ Named following existing project conventions
```
