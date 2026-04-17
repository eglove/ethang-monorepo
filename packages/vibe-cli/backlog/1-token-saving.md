## Split tasks between correct models Opus/Sonnet/Haiku

Invoke-Claude should have a required parameter for model that needs to be passed
in. All calls should use the appropriate claude model for the task. Minimizing
token cost.

## Use Everything CLI as find tools (or any that searches for file)

`es ...`

Acts as a hook to require using everything search cli when it can be used to
include finding files/foleders, searching

## Use ripgrep for searching contents of files

`rg ...`

Acts as a hook to replace grep and similar commands to search contents of a file

## Knowledge Graph (directed graph generation)

use data-structure-typed https://github.com/zrwusa/data-structure-typed to build
a directed graph with typescript that can then generate a markdown index of
files in the codebase, this will replace the current CLAUDE.md and replace
grpahify

nodes should be things like apps, package, components, functions, files. Edges
things like calls, depends_on, tested_by, test_for, etc.
