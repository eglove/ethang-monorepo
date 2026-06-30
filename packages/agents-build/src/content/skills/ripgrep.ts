import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const ripgrep = defineSkill({
  content: [
    {
      level: 1,
      text: "Ripgrep (rg) Skill Guide",
      type: "header"
    },
    {
      text: "Ripgrep (`rg`) is a line-oriented search tool that recursively searches the current directory for a regex pattern. By default, ripgrep respects `.gitignore` and automatically skips hidden files/directories and binary files. It's incredibly fast and perfect for searching through large codebases.",
      type: "text"
    },
    {
      text: "[!IMPORTANT]\nCopilot CLI has a built-in `grep` tool that uses ripgrep under the hood. Prefer using the built-in `grep` tool first for code searches. Only shell out to `rg` directly when you need flags not exposed by the built-in tool (e.g., `--pcre2`, `--multiline`, custom `--type-add`).",
      type: "quote"
    },
    {
      level: 2,
      text: "Table of Contents",
      type: "header"
    },
    {
      items: [
        {
          text: "[Basic Searching](#basic-searching)\n- [Case-Insensitive Search](#case-insensitive-search--i---ignore-case)\n- [Match Whole Words](#match-whole-words--w---word-regexp)\n- [Invert Match](#invert-match--v---invert-match)"
        },
        {
          text: "[Context Flags](#context-flags)\n- [Lines After Match](#lines-after-match--a---after-context)\n- [Lines Before Match](#lines-before-match--b---before-context)\n- [Lines Around Match](#lines-around-match--c---context)"
        },
        {
          text: "[File Filtering](#file-filtering)\n- [Print Filenames Only](#print-filenames-only--l---files-with-matches)\n- [Glob Filtering](#glob-filtering--g---glob)\n- [Search Specific File Types](#search-specific-file-types--t---type)"
        },
        {
          text: "[Search Behavior](#search-behavior)\n- [Search Hidden Files](#search-hidden-files---hidden)\n- [Ignore `.gitignore`](#ignore-gitignore---no-ignore)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "Basic Searching",
      type: "header"
    },
    {
      level: 3,
      text: "Case-Insensitive Search (`-i`, `--ignore-case`)",
      type: "header"
    },
    {
      text: "Searches without caring about uppercase or lowercase.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rg -i "my-search-term" packages/agents-build/src/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Match Whole Words (`-w`, `--word-regexp`)",
      type: "header"
    },
    {
      text: 'Only match the pattern as a whole word (so `rg -w "foo"` won\'t match `foobar`).\n**Example Usage:**',
      type: "text"
    },
    {
      code: 'rg -w "functionName" src/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Invert Match (`-v`, `--invert-match`)",
      type: "header"
    },
    {
      text: "Invert matching. Show all lines that do *not* match the pattern.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rg -v "console.log" src/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Context Flags",
      type: "header"
    },
    {
      level: 3,
      text: "Lines After Match (`-A`, `--after-context`)",
      type: "header"
    },
    {
      text: "Show `NUM` lines after each match.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rg -A 3 "class User" packages/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Lines Before Match (`-B`, `--before-context`)",
      type: "header"
    },
    {
      text: "Show `NUM` lines before each match.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rg -B 2 "return true;" src/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Lines Around Match (`-C`, `--context`)",
      type: "header"
    },
    {
      text: "Show `NUM` lines before and after each match.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rg -C 3 "function complexLogic" src/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "File Filtering",
      type: "header"
    },
    {
      level: 3,
      text: "Print Filenames Only (`-l`, `--files-with-matches`)",
      type: "header"
    },
    {
      text: "Only print the names of files that contain at least one match. This is extremely useful for discovering which files mention a specific token without dumping the whole file's contents into the context.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rg -l "export const globalRules" packages/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Glob Filtering (`-g`, `--glob`)",
      type: "header"
    },
    {
      text: "Include or exclude files and directories matching a glob pattern. Prefix with `!` to exclude.\n**Example Usage:**",
      type: "text"
    },
    {
      code: '# Only search inside TypeScript files\nrg -g "*.ts" "class" src/\n# Exclude test files\nrg -g "!*.test.ts" "function" src/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Search Specific File Types (`-t`, `--type`)",
      type: "header"
    },
    {
      text: "Search only files matching a specific type (e.g., `ts`, `js`, `json`).\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rg -t ts "interface" src/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Search Behavior",
      type: "header"
    },
    {
      level: 3,
      text: "Search Hidden Files (`--hidden`)",
      type: "header"
    },
    {
      text: "By default, ripgrep ignores hidden files and directories. This flag forces it to search them.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rg --hidden "secret" .github/',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Ignore `.gitignore` (`--no-ignore`)",
      type: "header"
    },
    {
      text: "Forces ripgrep to search files that would normally be ignored by `.gitignore` rules.\n**Example Usage:**",
      type: "text"
    },
    {
      code: "rg --no-ignore \"build_artifact\" dist/\n``\n\n## CLI Help Reference\n\n\n\n\n```text\nripgrep 15.1.0 (rev af60c2de9d)\nAndrew Gallant <jamslam@gmail.com>\n\nripgrep (rg) recursively searches the current directory for lines matching\na regex pattern. By default, ripgrep will respect gitignore rules and\nautomatically skip hidden files/directories and binary files.\n\nUse -h for short descriptions and --help for more details.\n\nProject home page: https://github.com/BurntSushi/ripgrep\n\nUSAGE:\n  rg [OPTIONS] PATTERN [PATH ...]\n\nPOSITIONAL ARGUMENTS:\n  <PATTERN>   A regular expression used for searching.\n  <PATH>...   A file or directory to search.\n\nINPUT OPTIONS:\n  -e, --regexp=PATTERN            A pattern to search for.\n  -f, --file=PATTERNFILE          Search for patterns from the given file.\n  --pre=COMMAND                   Search output of COMMAND for each PATH.\n  --pre-glob=GLOB                 Include or exclude files from a preprocessor.\n  -z, --search-zip                Search in compressed files.\n\nSEARCH OPTIONS:\n  -s, --case-sensitive            Search case sensitively (default).\n  --crlf                          Use CRLF line terminators (nice for Windows).\n  --dfa-size-limit=NUM            The upper size limit of the regex DFA.\n  -E, --encoding=ENCODING         Specify the text encoding of files to search.\n  --engine=ENGINE                 Specify which regex engine to use.\n  -F, --fixed-strings             Treat all patterns as literals.\n  -i, --ignore-case               Case insensitive search.\n  -v, --invert-match              Invert matching.\n  -x, --line-regexp               Show matches surrounded by line boundaries.\n  -m, --max-count=NUM             Limit the number of matching lines.\n  --mmap                          Search with memory maps when possible.\n  -U, --multiline                 Enable searching across multiple lines.\n  --multiline-dotall              Make '.' match line terminators.\n  --no-unicode                    Disable Unicode mode.\n  --null-data                     Use NUL as a line terminator.\n  -P, --pcre2                     Enable PCRE2 matching.\n  --regex-size-limit=NUM          The size limit of the compiled regex.\n  -S, --smart-case                Smart case search.\n  --stop-on-nonmatch              Stop searching after a non-match.\n  -a, --text                      Search binary files as if they were text.\n  -j, --threads=NUM               Set the approximate number of threads to use.\n  -w, --word-regexp               Show matches surrounded by word boundaries.\n  --auto-hybrid-regex             (DEPRECATED) Use PCRE2 if appropriate.\n  --no-pcre2-unicode              (DEPRECATED) Disable Unicode mode for PCRE2.\n\nFILTER OPTIONS:\n  --binary                        Search binary files.\n  -L, --follow                    Follow symbolic links.\n  -g, --glob=GLOB                 Include or exclude file paths.\n  --glob-case-insensitive         Process all glob patterns case insensitively.\n  -., --hidden                    Search hidden files and directories.\n  --iglob=GLOB                    Include/exclude paths case insensitively.\n  --ignore-file=PATH              Specify additional ignore files.\n  --ignore-file-case-insensitive  Process ignore files case insensitively.\n  -d, --max-depth=NUM             Descend at most NUM directories.\n  --max-filesize=NUM              Ignore files larger than NUM in size.\n  --no-ignore                     Don't use ignore files.\n  --no-ignore-dot                 Don't use .ignore or .rgignore files.\n  --no-ignore-exclude             Don't use local exclusion files.\n  --no-ignore-files               Don't use --ignore-file arguments.\n  --no-ignore-global              Don't use global ignore files.\n  --no-ignore-parent              Don't use ignore files in parent directories.\n  --no-ignore-vcs                 Don't use ignore files from source control.\n  --no-require-git                Use .gitignore outside of git repositories.\n  --one-file-system               Skip directories on other file systems.\n  -t, --type=TYPE                 Only search files matching TYPE.\n  -T, --type-not=TYPE             Do not search files matching TYPE.\n  --type-add=TYPESPEC             Add a new glob for a file type.\n  --type-clear=TYPE               Clear globs for a file type.\n  -u, --unrestricted              Reduce the level of \"smart\" filtering.\n\nOUTPUT OPTIONS:\n  -A, --after-context=NUM         Show NUM lines after each match.\n  -B, --before-context=NUM        Show NUM lines before each match.\n  --block-buffered                Force block buffering.\n  -b, --byte-offset               Print the byte offset for each matching line.\n  --color=WHEN                    When to use color.\n  --colors=COLOR_SPEC             Configure color settings and styles.\n  --column                        Show column numbers.\n  -C, --context=NUM               Show NUM lines before and after each match.\n  --context-separator=SEP         Set the separator for contextual chunks.\n  --field-context-separator=SEP   Set the field context separator.\n  --field-match-separator=SEP     Set the field match separator.\n  --heading                       Print matches grouped by each file.\n  -h, --help                      Show help output.\n  --hostname-bin=COMMAND          Run a program to get this system's hostname.\n  --hyperlink-format=FORMAT       Set the format of hyperlinks.\n  --include-zero                  Include zero matches in summary output.\n  --line-buffered                 Force line buffering.\n  -n, --line-number               Show line numbers.\n  -N, --no-line-number            Suppress line numbers.\n  -M, --max-columns=NUM           Omit lines longer than this limit.\n  --max-columns-preview           Show preview for lines exceeding the limit.\n  -0, --null                      Print a NUL byte after file paths.\n  -o, --only-matching             Print only matched parts of a line.\n  --path-separator=SEP            Set the path separator for printing paths.\n  --passthru                      Print both matching and non-matching lines.\n  -p, --pretty                    Alias for colors, headings and line numbers.\n  -q, --quiet                     Do not print anything to stdout.\n  -r, --replace=TEXT              Replace matches with the given text.\n  --sort=SORTBY                   Sort results in ascending order.\n  --sortr=SORTBY                  Sort results in descending order.\n  --trim                          Trim prefix whitespace from matches.\n  --vimgrep                       Print results in a vim compatible format.\n  -H, --with-filename             Print the file path with each matching line.\n  -I, --no-filename               Never print the path with each matching line.\n  --sort-files                    (DEPRECATED) Sort results by file path.\n\nOUTPUT MODES:\n  -c, --count                     Show count of matching lines for each file.\n  --count-matches                 Show count of every match for each file.\n  -l, --files-with-matches        Print the paths with at least one match.\n  --files-without-match           Print the paths that contain zero matches.\n  --json                          Show search results in a JSON Lines format.\n\nLOGGING OPTIONS:\n  --debug                         Show debug messages.\n  --no-ignore-messages            Suppress gitignore parse error messages.\n  --no-messages                   Suppress some error messages.\n  --stats                         Print statistics about the search.\n  --trace                         Show trace messages.\n\nOTHER BEHAVIORS:\n  --files                         Print each file that would be searched.\n  --generate=KIND                 Generate man pages and completion scripts.\n  --no-config                     Never read configuration files.\n  --pcre2-version                 Print the version of PCRE2 that ripgrep uses.\n  --type-list                     Show all supported file types.\n  -V, --version                   Print ripgrep's version.\n",
      language: "bash",
      type: "codeBlock"
    }
  ] as MarkdownBlock[],
  description:
    "Explains how to use Ripgrep (rg), including common flags, context options, file filtering.",
  name: "ripgrep"
});
