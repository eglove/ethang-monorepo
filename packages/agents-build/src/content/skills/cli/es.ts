import { defineSkill } from "../../../define.ts";

export const esSkill = defineSkill({
  content: `# Everything Search CLI (\`es\`) Reference

Use this skill to locate files and folders instantly across the Windows filesystem using the \`es\` command-line interface.

## Basic Usage

\`\`\`powershell
es [options] <search-string>
\`\`\`

## Key Options

### Filter Options
- \`/ad\` : Folders only.
- \`/a-d\` : Files only.
- \`/a[RHSDAVNTPLCOIEUPM]\` : DIR style attributes search.
  - \`R\` = Read only, \`H\` = Hidden, \`S\` = System, \`D\` = Directory, \`A\` = Archive, \`T\` = Temporary.
  - Prefix a flag with \`-\` to exclude (e.g. \`/a-h\` to exclude hidden files).

### Sort Options
- \`-s\` : Sort by full path.
- \`-sort <name[-ascending|-descending]>\` : Set sort order.
  - Names: \`name\`, \`path\`, \`size\`, \`extension\`, \`date-created\`, \`date-modified\`, \`date-accessed\`, \`attributes\`.
- \`/on\`, \`/o-n\`, \`/os\`, \`/o-s\`, \`/oe\`, \`/o-e\`, \`/od\`, \`/o-d\` : DIR style sorts.
  - \`N\` = Name, \`S\` = Size, \`E\` = Extension, \`D\` = Date modified, \`-\` = descending.

### Display Options
- \`-name\` : Show name column.
- \`-path-column\` : Show path column.
- \`-full-path-and-name\`, \`-filename-column\` : Show full path and name.
- \`-extension\`, \`-ext\` : Show extension column.
- \`-size\` : Show size column.
- \`-date-created\`, \`-dc\`, \`-date-modified\`, \`-dm\`, \`-date-accessed\`, \`-da\` : Show specified date column.
- \`-csv\`, \`-json\`, \`-tsv\`, \`-txt\` : Change display format.
- \`-double-quote\` : Wrap paths and filenames with double quotes.

### Viewport Options
- \`-viewport-offset <offset>\` : Show results starting from offset.
- \`-viewport-count <num>\` : Limit the number of results shown.

### Export Options
- \`-export-csv <out.csv>\`, \`-export-json <out.json>\`, \`-export-tsv <out.tsv>\`, \`-export-txt <out.txt>\` : Export to a file using the specified layout.
- \`-no-header\` : Do not output a column header for CSV, EFU, and TSV files.

## Examples

1. Search for JSON files matching "package" in their name:
   \`\`\`powershell
   es -json package.json
   \`\`\`

2. Search for directories only with name "src" and sort by path:
   \`\`\`powershell
   es /ad -s src
   \`\`\`

3. Get JSON output and wrap paths with double quotes:
   \`\`\`powershell
   es -json -double-quote my-file
   \`\`\`
`,
  description:
    "Locate files and folders instantly across the Windows filesystem using the Everything Search CLI (es). Use for path searching and file discovery.",
  name: "es-cli"
});
