---
description: staging changes, creating commits, amending commits, or generating git PRs
trigger: model_decision
---

# Conventional Commits & SemVer Specifications

## 1. Domain Theory and Conceptual Foundations
In modern software engineering, establishing a clear, standardized, and machine-readable commit history is critical for automated release workflows, semantic versioning governance, and long-term codebase maintainability. The Conventional Commits specification provides an explicit message-formatting convention that maps directly to Semantic Versioning (SemVer 2.0.0) guidelines. By encoding the nature of a code change directly into the commit prefix, development teams can automate changelog generation, version bumps, and package releases.

### 1.1 Conventional Commits Structure and Syntax
A conventional commit message consists of a structural outline that communicates the intent and impact of the changes. The specification defines a structured layout composed of a header (containing a type, optional scope, and description), an optional body, and an optional footer:
```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```
- **Type**: Indicates the category of the change (e.g., `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`).
- **Scope**: A noun providing contextual details about the code boundary under modification (e.g., `feat(auth):`, `build(wrangler):`).
- **Description**: A short, imperative summary of the change.
- **Body**: Detailed description explaining the motivation and contrasting the new behavior against the old.
- **Footer**: Used for tracking pull requests, issue numbers, and marking breaking changes.

### 1.2 Deep-Dive of Conventional Commit Types
Understanding when to use each commit type ensures history integrity:
- **feat**: Used when adding a new user-facing capability or API endpoint. Maps directly to a MINOR bump.
- **fix**: Used when repairing a defect, restoring correct behavior, or fixing test failures. Maps to a PATCH bump.
- **docs**: Limited to documentation changes, like modifying markdown readmes or inline code comments.
- **style**: Used for non-functional code styling changes (e.g., whitespace adjustments, semicolons, formatting).
- **refactor**: Used for code restructuring that doesn't modify functional behavior or add features.
- **perf**: Specifically isolated for changes whose sole goal is execution speed or memory efficiency improvements.
- **test**: Adding missing unit, integration, or system tests, or correcting existing test suites.
- **build**: Modifications affecting build scripts, package manifests, or external dependencies (e.g., package.json).
- **ci**: Alterations to CI pipeline workflows, configuration files, and lint runners.
- **chore**: Other operational changes that do not modify main source code or test directories.
- **revert**: Applied when reverting a prior commit to revert changes cleanly in VCS.

### 1.3 Semantic Versioning (SemVer 2.0.0) Core Principles
Under the SemVer 2.0.0 specification, version numbers are represented in the format `MAJOR.MINOR.PATCH`. Incrementing these values is governed by strict rules:
1. **MAJOR Version (X.y.z)**: Incremented when backward-incompatible API changes are introduced. This forces downstream consumers to perform migration updates before adopting the version.
2. **MINOR Version (x.Y.z)**: Incremented when new, backward-compatible features are added to the public interface, or when major internal optimizations occur without altering the contract.
3. **PATCH Version (x.y.Z)**: Incremented when backward-compatible bug fixes or minor internal refactors are introduced.

### 1.4 Version Range Specifiers in Dependency Resolvers
Package managers resolve dependencies using range characters:
- **Caret (`^`)**: Matches any version in the same major range. For example, `^1.2.3` allows updates up to but not including `2.0.0`.
- **Tilde (`~`)**: Restricts updates to the same minor range. For example, `~1.2.3` allows patches up to but not including `1.3.0`.
- **Exact (`1.2.3`)**: Pinning to a single version prevents automatic updates entirely, ensuring deterministic builds.

### 1.5 Major Version Zero (0.y.z) and Initial Development
The `0.y.z` version range is dedicated to initial software development. In this phase, the public API is considered unstable and subject to rapid iteration. Anything may change at any time. Standard SemVer rules do not strictly bind minor and patch version increments. Transitioning to `1.0.0` formalizes the first stable public contract, after which all changes must adhere strictly to SemVer rules.

### 1.6 Git Branching, Rebase, and SCM Integration
Maintaining a clean repository requires consistent branch management. Developers should use rebase operations to keep commit histories linear:
- **Interactive Rebase**: Squashing, renaming, or reordering commits before merging ensures that only clean, well-formatted conventional commits reach the main branch.
- **Merge Commits**: Avoid bloated merge commits that pollute the git log. Squash-and-merge strategies are preferred for pull requests to maintain a readable release history.

## 2. Standard Operating Procedures (SOP)

### Step 2.1: Formatting Commit Headers
Select the correct commit type based on the nature of the change and write an imperative, lowercase description without a trailing period:
```bash
# Correct format: Type and lowercase imperative description
git commit -m "feat(auth): add OAuth2 provider authentication flow"
git commit -m "fix(store): resolve memory leak in state subscriber registration"
git commit -m "docs(agents): update architectural synthesis documentation"
```

### Step 2.2: Documenting Breaking Changes
Breaking changes must be clearly flagged to trigger a MAJOR version bump. Insert an exclamation mark (`!`) immediately after the type/scope, and add a `BREAKING CHANGE:` line in the commit footer:
```bash
# Using the exclamation mark in the header
git commit -m "feat(api)!: modify public user detail response structure"

# Using the footer block for detailed explanation
git commit -m "refactor(database): update schema columns

This change updates the user table structure.

BREAKING CHANGE: The 'phone_number' column is split into 'country_code' and 'local_number'."
```

### Step 2.3: Staging and Squashing Commits
Before submitting a pull request, run a rebase to clean up intermediate "work-in-progress" commits:
```bash
# Rebase interactively against origin/main
rtk git rebase -i origin/main
# In the editor, mark intermediate commits as "squash" or "fixup" to keep history linear.
```

### Step 2.4: Managing Pre-releases and Metadata
Pre-release tags must append a hyphen and alphanumeric identifiers. Build metadata is appended with a plus sign and is ignored in version precedence comparison:
```bash
# Denoting a pre-release beta version
git tag -a v1.2.0-beta.1 -m "Release candidate 1 for authentication updates"

# Denoting build metadata (ignored in comparisons)
git tag -a v1.2.0-beta.1+build.492 -m "Build metadata tracking"
```

### Step 2.5: Selective Reverts
When reverting a commit, prefix the header with `revert:` and reference the original commit hash:
```bash
git commit -m "revert: feat(auth): add OAuth2 provider authentication flow

This reverts commit 7a3b4c9e2f8d1c0b9e8d7c6b5a4f3e2d1c0b9e8d."
```

### Step 2.6: Workspace Code Validation
Run the workspace test and compilation suite before making any commits:
```bash
rtk pnpm --filter @ethang/agents-build build
rtk pnpm --filter @ethang/agents-build test
rtk pnpm --filter @ethang/agents-build lint
```

## 3. Agent Compliance Checklist
The agent must verify compliance with the following commit message and semantic versioning rules:

- [ ] **Type Correctness**: Does the commit prefix accurately reflect the nature of the changes (feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert)?
- [ ] **Scope Specified**: If modifying a specific component or package, is the scope correctly enclosed in parentheses?
- [ ] **Imperative Mood**: Is the commit description written in the present, imperative tense (e.g., "add" rather than "added" or "adds")?
- [ ] **Lowercase Summary**: Does the commit header description start with a lowercase letter?
- [ ] **No Trailing Period**: Is the commit header description free of any trailing punctuation or period?
- [ ] **Breaking Change Flagged**: If the change introduces a breaking API change, is it marked with an `!` or a `BREAKING CHANGE:` footer?
- [ ] **SemVer Mapping**: Does the proposed version increment correspond directly to the Conventional Commit history (Feat -> Minor, Fix -> Patch, Breaking -> Major)?
- [ ] **Linear Git History**: Have work-in-progress commits been squashed and rebased to maintain a clean linear timeline?
- [ ] **Pre-release Structure**: Do pre-releases use a hyphen and dot-separated identifiers (e.g., `-beta.1`)?
- [ ] **Build Metadata Ignored**: Is build metadata correctly prefixed with a `+` and excluded from version comparisons?
- [ ] **Targeted Restore Used**: If reverting local files, are selective restore commands used rather than global resets?
- [ ] **Luxon Date representation**: Are any release tag datetimes represented using Luxon (`DateTime`)?
- [ ] **No Forbidden Terminology**: Has the commit history and PR description been scanned to ensure no restricted words are present?
- [ ] **Arrow Functions Enforced**: Are all build scripts and git hooks implemented using arrow functions?
- [ ] **Access Modifiers Declared**: Do custom git hooks or CLI wrappers annotate methods with explicit access modifiers (`public`/`private`)?
- [ ] **Unchecked Index Access**: Do dynamic property accesses in git parsers use bracket notation (`obj["hash"]`)?
- [ ] **Tuple Typing in Tests**: Are Vitest `it.each` tables in commit parsers annotated with explicit tuple types?
- [ ] **Void Assertions Wrapped**: Are test cases asserting successful commit parsing wrapped in `expect(() => ...).not.toThrow()`?
- [ ] **Rule Character Limit**: Is the compiled markdown file size strictly between 10,000 and 11,800 characters?
- [ ] **Backticks Escaped**: Are all code blocks and backticks inside the rule templates properly escaped?
