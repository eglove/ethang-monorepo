---
description: Explains how to use Ripgrep (rg), including common flags, context options, file filtering, and workspace-specific commands like rtk.
name: ripgrep
---

# Ripgrep (rg) Skill Guide

Ripgrep (`rg`) is a line-oriented search tool that recursively searches the current directory for a regex pattern. By default, ripgrep respects `.gitignore` and automatically skips hidden files/directories and binary files. It's incredibly fast and perfect for searching through large codebases.

> [!IMPORTANT]
> Within this workspace, you must ALWAYS prefix your `rg` commands with `rtk` (e.g., `rtk rg "pattern" path/`) to optimize the context window and token budget by compressing output.

## Table of Contents

* [Basic Searching](#basic-searching)
- [Case-Insensitive Search](#case-insensitive-search--i---ignore-case)
- [Match Whole Words](#match-whole-words--w---word-regexp)
- [Invert Match](#invert-match--v---invert-match)
* [Context Flags](#context-flags)
- [Lines After Match](#lines-after-match--a---after-context)
- [Lines Before Match](#lines-before-match--b---before-context)
- [Lines Around Match](#lines-around-match--c---context)
* [File Filtering](#file-filtering)
- [Print Filenames Only](#print-filenames-only--l---files-with-matches)
- [Glob Filtering](#glob-filtering--g---glob)
- [Search Specific File Types](#search-specific-file-types--t---type)
* [Search Behavior](#search-behavior)
- [Search Hidden Files](#search-hidden-files---hidden)
- [Ignore `.gitignore`](#ignore-gitignore---no-ignore)

## Basic Searching

### Case-Insensitive Search (`-i`, `--ignore-case`)

Searches without caring about uppercase or lowercase.
**Example Usage:**

```bash
rtk rg -i "my-search-term" packages/agents-build/src/
```

### Match Whole Words (`-w`, `--word-regexp`)

Only match the pattern as a whole word (so `rg -w "foo"` won't match `foobar`).
**Example Usage:**

```bash
rtk rg -w "functionName" src/
```

### Invert Match (`-v`, `--invert-match`)

Invert matching. Show all lines that do *not* match the pattern.
**Example Usage:**

```bash
rtk rg -v "console.log" src/
```

## Context Flags

### Lines After Match (`-A`, `--after-context`)

Show `NUM` lines after each match.
**Example Usage:**

```bash
rtk rg -A 3 "class User" packages/
```

### Lines Before Match (`-B`, `--before-context`)

Show `NUM` lines before each match.
**Example Usage:**

```bash
rtk rg -B 2 "return true;" src/
```

### Lines Around Match (`-C`, `--context`)

Show `NUM` lines before and after each match.
**Example Usage:**

```bash
rtk rg -C 3 "function complexLogic" src/
```

## File Filtering

### Print Filenames Only (`-l`, `--files-with-matches`)

Only print the names of files that contain at least one match. This is extremely useful for discovering which files mention a specific token without dumping the whole file's contents into the context.
**Example Usage:**

```bash
rtk rg -l "export const globalRules" packages/
```

### Glob Filtering (`-g`, `--glob`)

Include or exclude files and directories matching a glob pattern. Prefix with `!` to exclude.
**Example Usage:**

```bash
# Only search inside TypeScript files
rtk rg -g "*.ts" "class" src/
# Exclude test files
rtk rg -g "!*.test.ts" "function" src/
```

### Search Specific File Types (`-t`, `--type`)

Search only files matching a specific type (e.g., `ts`, `js`, `json`).
**Example Usage:**

```bash
rtk rg -t ts "interface" src/
```

## Search Behavior

### Search Hidden Files (`--hidden`)

By default, ripgrep ignores hidden files and directories. This flag forces it to search them.
**Example Usage:**

```bash
rtk rg --hidden "secret" .github/
```

### Ignore `.gitignore` (`--no-ignore`)

Forces ripgrep to search files that would normally be ignored by `.gitignore` rules.
**Example Usage:**

```bash
rtk rg --no-ignore "build_artifact" dist/
``

## CLI Help Reference




```text
ripgrep 15.1.0 (rev af60c2de9d)
Andrew Gallant <jamslam@gmail.com>

ripgrep (rg) recursively searches the current directory for lines matching
a regex pattern. By default, ripgrep will respect gitignore rules and
automatically skip hidden files/directories and binary files.

Use -h for short descriptions and --help for more details.

Project home page: https://github.com/BurntSushi/ripgrep

USAGE:
  rg [OPTIONS] PATTERN [PATH ...]

POSITIONAL ARGUMENTS:
  <PATTERN>   A regular expression used for searching.
  <PATH>...   A file or directory to search.

INPUT OPTIONS:
  -e, --regexp=PATTERN            A pattern to search for.
  -f, --file=PATTERNFILE          Search for patterns from the given file.
  --pre=COMMAND                   Search output of COMMAND for each PATH.
  --pre-glob=GLOB                 Include or exclude files from a preprocessor.
  -z, --search-zip                Search in compressed files.

SEARCH OPTIONS:
  -s, --case-sensitive            Search case sensitively (default).
  --crlf                          Use CRLF line terminators (nice for Windows).
  --dfa-size-limit=NUM            The upper size limit of the regex DFA.
  -E, --encoding=ENCODING         Specify the text encoding of files to search.
  --engine=ENGINE                 Specify which regex engine to use.
  -F, --fixed-strings             Treat all patterns as literals.
  -i, --ignore-case               Case insensitive search.
  -v, --invert-match              Invert matching.
  -x, --line-regexp               Show matches surrounded by line boundaries.
  -m, --max-count=NUM             Limit the number of matching lines.
  --mmap                          Search with memory maps when possible.
  -U, --multiline                 Enable searching across multiple lines.
  --multiline-dotall              Make '.' match line terminators.
  --no-unicode                    Disable Unicode mode.
  --null-data                     Use NUL as a line terminator.
  -P, --pcre2                     Enable PCRE2 matching.
  --regex-size-limit=NUM          The size limit of the compiled regex.
  -S, --smart-case                Smart case search.
  --stop-on-nonmatch              Stop searching after a non-match.
  -a, --text                      Search binary files as if they were text.
  -j, --threads=NUM               Set the approximate number of threads to use.
  -w, --word-regexp               Show matches surrounded by word boundaries.
  --auto-hybrid-regex             (DEPRECATED) Use PCRE2 if appropriate.
  --no-pcre2-unicode              (DEPRECATED) Disable Unicode mode for PCRE2.

FILTER OPTIONS:
  --binary                        Search binary files.
  -L, --follow                    Follow symbolic links.
  -g, --glob=GLOB                 Include or exclude file paths.
  --glob-case-insensitive         Process all glob patterns case insensitively.
  -., --hidden                    Search hidden files and directories.
  --iglob=GLOB                    Include/exclude paths case insensitively.
  --ignore-file=PATH              Specify additional ignore files.
  --ignore-file-case-insensitive  Process ignore files case insensitively.
  -d, --max-depth=NUM             Descend at most NUM directories.
  --max-filesize=NUM              Ignore files larger than NUM in size.
  --no-ignore                     Don't use ignore files.
  --no-ignore-dot                 Don't use .ignore or .rgignore files.
  --no-ignore-exclude             Don't use local exclusion files.
  --no-ignore-files               Don't use --ignore-file arguments.
  --no-ignore-global              Don't use global ignore files.
  --no-ignore-parent              Don't use ignore files in parent directories.
  --no-ignore-vcs                 Don't use ignore files from source control.
  --no-require-git                Use .gitignore outside of git repositories.
  --one-file-system               Skip directories on other file systems.
  -t, --type=TYPE                 Only search files matching TYPE.
  -T, --type-not=TYPE             Do not search files matching TYPE.
  --type-add=TYPESPEC             Add a new glob for a file type.
  --type-clear=TYPE               Clear globs for a file type.
  -u, --unrestricted              Reduce the level of "smart" filtering.

OUTPUT OPTIONS:
  -A, --after-context=NUM         Show NUM lines after each match.
  -B, --before-context=NUM        Show NUM lines before each match.
  --block-buffered                Force block buffering.
  -b, --byte-offset               Print the byte offset for each matching line.
  --color=WHEN                    When to use color.
  --colors=COLOR_SPEC             Configure color settings and styles.
  --column                        Show column numbers.
  -C, --context=NUM               Show NUM lines before and after each match.
  --context-separator=SEP         Set the separator for contextual chunks.
  --field-context-separator=SEP   Set the field context separator.
  --field-match-separator=SEP     Set the field match separator.
  --heading                       Print matches grouped by each file.
  -h, --help                      Show help output.
  --hostname-bin=COMMAND          Run a program to get this system's hostname.
  --hyperlink-format=FORMAT       Set the format of hyperlinks.
  --include-zero                  Include zero matches in summary output.
  --line-buffered                 Force line buffering.
  -n, --line-number               Show line numbers.
  -N, --no-line-number            Suppress line numbers.
  -M, --max-columns=NUM           Omit lines longer than this limit.
  --max-columns-preview           Show preview for lines exceeding the limit.
  -0, --null                      Print a NUL byte after file paths.
  -o, --only-matching             Print only matched parts of a line.
  --path-separator=SEP            Set the path separator for printing paths.
  --passthru                      Print both matching and non-matching lines.
  -p, --pretty                    Alias for colors, headings and line numbers.
  -q, --quiet                     Do not print anything to stdout.
  -r, --replace=TEXT              Replace matches with the given text.
  --sort=SORTBY                   Sort results in ascending order.
  --sortr=SORTBY                  Sort results in descending order.
  --trim                          Trim prefix whitespace from matches.
  --vimgrep                       Print results in a vim compatible format.
  -H, --with-filename             Print the file path with each matching line.
  -I, --no-filename               Never print the path with each matching line.
  --sort-files                    (DEPRECATED) Sort results by file path.

OUTPUT MODES:
  -c, --count                     Show count of matching lines for each file.
  --count-matches                 Show count of every match for each file.
  -l, --files-with-matches        Print the paths with at least one match.
  --files-without-match           Print the paths that contain zero matches.
  --json                          Show search results in a JSON Lines format.

LOGGING OPTIONS:
  --debug                         Show debug messages.
  --no-ignore-messages            Suppress gitignore parse error messages.
  --no-messages                   Suppress some error messages.
  --stats                         Print statistics about the search.
  --trace                         Show trace messages.

OTHER BEHAVIORS:
  --files                         Print each file that would be searched.
  --generate=KIND                 Generate man pages and completion scripts.
  --no-config                     Never read configuration files.
  --pcre2-version                 Print the version of PCRE2 that ripgrep uses.
  --type-list                     Show all supported file types.
  -V, --version                   Print ripgrep's version.

```
