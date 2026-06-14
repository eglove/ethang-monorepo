---
description: Process, filter, and format JSON data using jq. Use when reading, inspecting, or manipulating structured JSON files or stream outputs.
name: jq-cli
---

# jq (JSON processor) Reference

Use this skill to parse, filter, format, and slice JSON data using the `jq` command-line interface.

## Basic Usage

```powershell
jq [options] <jq filter> [file...]
# Or via pipeline
cat file.json | jq [options] <jq filter>
```

## Key Options

- `-n`, `--null-input` : Use `null` as the single input value (useful for creating JSON from scratch).
- `-R`, `--raw-input` : Read each line as a string instead of JSON.
- `-s`, `--slurp` : Read all inputs into a single large array and apply the filter to it.
- `-c`, `--compact-output` : Compact output (single line per JSON object) instead of pretty-printed.
- `-r`, `--raw-output` : Output strings directly without escapes or enclosing quotes.
- `-S`, `--sort-keys` : Sort keys of each object on output.
- `--arg name value` : Set a global variable `$name` to the string `value`.
- `--argjson name value` : Set a global variable `$name` to the JSON parsed `value`.
- `-e`, `--exit-status` : Set exit status code based on whether the output is null/false.

## Common Filter Patterns

- `.` : The identity filter. Pretty-prints the input JSON unmodified.
- `.key` : Extract value at a specific key.
- `.[]` : Unbox an array or object values.
- `map(<filter>)` : Apply a filter to each element of an array.
- `select(<boolean_expression>)` : Keep only items matching the condition.
- `{key1: .val1, key2: .val2}` : Reconstruct a new JSON object.

## Examples

1. Pretty print a JSON file:
   ```powershell
   jq . package.json
   ```

2. Extract the `dependencies` object from `package.json`:
   ```powershell
   jq .dependencies package.json
   ```

3. List only the names of packages in monorepo pnpm-workspace:
   ```powershell
   jq -r ".packages[]" pnpm-workspace.yaml
   ```
