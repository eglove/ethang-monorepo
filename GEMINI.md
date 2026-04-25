# Project Mandates

- **Shell:** Always use `pwsh` (PowerShell 7) for executing commands.
- **ESLint:** If you struggle to fix an ESLint issue after multiple attempts, ask the user for a solution or guidance before resorting to ignoring the rule.
- **Object Access:** Always use `lodash/get` when accessing object properties that are 2 or more levels deep.
- **Data Parsing:** Always use `zod` to validate and parse unknown objects, such as API responses, instead of relying on type assertions or assuming the object structure.
