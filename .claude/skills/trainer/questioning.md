# Questioning Protocol

## Purpose

Systematic clarification before any artifact is written. The goal is full shared understanding — not just enough to start, but enough to finish without surprises.

## Step 1: Map the Decision Tree

Before asking anything, internally enumerate every branch:

- **Purpose:** What problem does this solve? Who uses it? When?
- **Artifact type:** Hook, command, agent, orchestrator, or suite? (see artifact-guide.md)
- **Trigger:** What initiates this? (user invocation, tool event, handoff from another agent)
- **Inputs:** What context or data does it receive?
- **Outputs:** What does it produce? In what format?
- **Ecosystem placement:** Standalone, part of a chain, or both?
- **Handoff format:** If chained, what does it pass downstream and to whom?
- **Error states:** What can go wrong? How should failures surface?
- **Naming:** What should it be called? (affects discoverability)
- **Scope:** What is explicitly out of scope?
- **Edge cases:** Unusual inputs, empty states, ambiguous situations

## Step 2: Resolve in Dependency Order

Upstream decisions gate downstream ones. Never ask a downstream question before its upstream is settled:

1. **Purpose** → determines artifact type
2. **Artifact type** → determines location and template
3. **Trigger** → determines when it runs
4. **Inputs** → determines what it can work with
5. **Outputs** → determines what downstream consumers receive
6. **Ecosystem placement** → standalone vs. chained behavior
7. **Handoff format** → only if chained; defines the interface contract
8. **Error states** → robustness requirements
9. **Naming** → after purpose and type are clear
10. **Scope and edge cases** → last, after the core shape is established

## Step 3: One Question Per Message, Always with a Recommendation

Format every question as:

> "My recommendation: [X], because [Y]. Does that match your intent?"

This shifts cognitive load to Trainer. The user confirms or redirects — they never have to think from scratch.

Rules:
- Never ask "what should it do?" — always have a point of view
- One question per message — never bundle questions
- Multiple choice preferred over open-ended when options are enumerable
- If the user says "yes", move to the next branch immediately
- If the user redirects, update the mental model and continue

## Step 4: Never Close a Branch Early

If a question reveals a sub-branch, walk all the way down it before moving on.

Example:
> Q: "Is this standalone or called by an orchestrator?"
> A: "Both"
> → Next: "When called standalone, what does the user pass?" [resolve fully]
> → Then: "When called by an orchestrator, what context does it receive?" [resolve fully]
> → Only then: move to the next top-level branch

## Step 5: Sign-Off Gate

When all branches are resolved:

1. Recap the complete agreed design in a concise summary (artifact type, location, trigger, inputs, outputs, handoff if applicable, name, scope)
2. Ask explicitly: **"Does this match what you want? Say yes to proceed."**
3. Do NOT write any files until the user confirms with a clear yes
