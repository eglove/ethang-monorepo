import { defineSkill } from "../../../define.ts";

export const rgSkill = defineSkill({
  content: `# ripgrep (rg) Reference

Use this skill to recursively search the current directory for lines matching a regex pattern. By default, ripgrep respects gitignore rules, skipping hidden and binary files.

## Basic Usage

\`\`\`powershell
rg [options] PATTERN [PATH ...]
\`\`\`

## Key Options

### Input & Search Options
- \`-e PATTERN\`, \`--regexp=PATTERN\` : A pattern to search for (useful when pattern starts with a dash).
- \`-F\`, \`--fixed-strings\` : Treat the pattern as a literal string instead of a regular expression.
- \`-i\`, \`--ignore-case\` : Case-insensitive search.
- \`-s\`, \`--case-sensitive\` : Case-sensitive search (default).
- \`-S\`, \`--smart-case\` : Case-insensitive if the pattern is all lowercase; case-sensitive otherwise.
- \`-v\`, \`--invert-match\` : Invert match (show lines that do not match).
- \`-w\`, \`--word-regexp\` : Match only whole words.
- \`-x\`, \`--line-regexp\` : Match only whole lines.
- \`-m NUM\`, \`--max-count=NUM\` : Limit the number of matching lines per file.

### Filter Options
- \`-.\`, \`--hidden\` : Search hidden files and directories as well.
- \`-g GLOB\`, \`--glob=GLOB\` : Include or exclude file paths (e.g. \`-g '!**/node_modules/**'\` or \`-g '*.ts'\`).
- \`--binary\` : Search binary files.
- \`--no-ignore\` : Don't respect ignore files (.gitignore, .ignore, etc.).
- \`-t TYPE\`, \`--type=TYPE\` : Only search files matching file type (e.g. \`rg -t ts pattern\`).
- \`-T TYPE\`, \`--type-not=TYPE\` : Do not search files of this type.
- \`--type-list\` : Show all supported file types and their globs.

### Output Options
- \`-A NUM\`, \`--after-context=NUM\` : Show NUM lines of trailing context after each match.
- \`-B NUM\`, \`--before-context=NUM\` : Show NUM lines of leading context before each match.
- \`-C NUM\`, \`--context=NUM\` : Show NUM lines of context before and after matches.
- \`-n\`, \`--line-number\` : Show line numbers (default).
- \`-N\`, \`--no-line-number\` : Suppress line numbers.
- \`-o\`, \`--only-matching\` : Print only the matched part of the line.
- \`-r TEXT\`, \`--replace=TEXT\` : Replace matches in the output with the given text.
- \`-H\`, \`--with-filename\` : Print the file path with each matching line.
- \`-I\`, \`--no-filename\` : Suppress file paths.

### Output Modes
- \`-c\`, \`--count\` : Show count of matching lines for each file.
- \`--count-matches\` : Show count of every individual match for each file.
- \`-l\`, \`--files-with-matches\` : Print only the paths of files containing at least one match.
- \`--files-without-match\` : Print only paths of files containing zero matches.
- \`--files\` : Print each file that would be searched without actually searching.
- \`--json\` : Show search results in a JSON Lines format.

## Examples

1. Search for a literal string case-insensitively in all TypeScript files:
   \`\`\`powershell
   rg -i -t ts "userRepository"
   \`\`\`

2. List files containing the pattern without showing match contents:
   \`\`\`powershell
   rg -l "definePlugin"
   \`\`\`

3. Find matches including hidden files, but ignoring node_modules:
   \`\`\`powershell
   rg --hidden -g '!**/node_modules/**' "antigravity"
   \`\`\`
`,
  description: "Recursively search files and directories using ripgrep (rg). Use for text searching, pattern matching, and file listing.",
  name: "rg-cli"
});
