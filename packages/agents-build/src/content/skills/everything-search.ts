import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const everythingSearch = defineSkill({
  content: [
    {
      level: 1,
      text: "Everything Search (es) Skill Guide",
      type: "header"
    },
    {
      text: '`es` is the command-line interface for the "Everything" search engine on Windows. It accesses the Master File Table (MFT) of NTFS volumes via the Everything IPC service, allowing it to locate files and folders instantly across the entire filesystem.',
      type: "text"
    },
    {
      text: "[!IMPORTANT]\nWithin this workspace, use `es` directly for fast filesystem lookups (e.g., `es *pattern*`).",
      type: "quote"
    },
    {
      text: "[!WARNING]\nIf the Everything service is inactive or not running on the host machine, `es` queries will fail. If this happens, fall back to WebStorm's `find_files_by_glob` or `ripgrep` (`rg`).",
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
          text: "[Basic File Searching](#basic-file-searching)\n- [Simple Keyword Search](#simple-keyword-search)\n- [Wildcard Search](#wildcard-search)"
        },
        {
          text: "[Filtering by Type](#filtering-by-type)\n- [Files Only (`/a-d`)](#files-only-a-d)\n- [Directories Only (`/ad`)](#directories-only-ad)"
        },
        {
          text: "[Advanced Matching](#advanced-matching)\n- [Regex Search (`-r`)](#regex-search--r)\n- [Match Full Path (`-p`)](#match-full-path--p)\n- [Limit Results (`-n`)](#limit-results--n)"
        },
        {
          text: "[Formatting Output](#formatting-output)\n- [JSON Output (`-json`)](#json-output--json)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "Basic File Searching",
      type: "header"
    },
    {
      level: 3,
      text: "Simple Keyword Search",
      type: "header"
    },
    {
      text: "Find files or folders containing the keyword anywhere in their name.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'es "my-module"',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Wildcard Search",
      type: "header"
    },
    {
      text: "Use `*` and `?` to perform glob-style matching on filenames.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'es "*my-module*.ts"',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Filtering by Type",
      type: "header"
    },
    {
      level: 3,
      text: "Files Only (`/a-d`)",
      type: "header"
    },
    {
      text: "Exclude directories from the results. This is the most common flag when looking for source files.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'es /a-d "*controller*.js"',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Directories Only (`/ad`)",
      type: "header"
    },
    {
      text: "Only return folders. Useful for locating project directories or configuration folders.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'es /ad "node_modules"',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Advanced Matching",
      type: "header"
    },
    {
      level: 3,
      text: "Regex Search (`-r`)",
      type: "header"
    },
    {
      text: "Use regular expressions to match filenames instead of simple wildcards.\n**Example Usage:**",
      type: "text"
    },
    {
      code: String.raw`es -r "^test_.*\\.ts$"`,
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Match Full Path (`-p`)",
      type: "header"
    },
    {
      text: "By default, `es` matches against the filename. Use `-p` to match against the full absolute path.\n**Example Usage:**",
      type: "text"
    },
    {
      code: String.raw`es -p "packages\\agents-build\\*.ts"`,
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Limit Results (`-n`)",
      type: "header"
    },
    {
      text: "Restrict the number of results returned. Highly recommended to prevent flooding the context window.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'es -n 5 "*index*.ts"',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Formatting Output",
      type: "header"
    },
    {
      level: 3,
      text: "JSON Output (`-json`)",
      type: "header"
    },
    {
      text: "Format the search results as a JSON array. This is extremely powerful when combined with `jq`.\n**Example Usage:**",
      type: "text"
    },
    {
      code: "# Output as JSON\nes /a-d -json *my-module*.ts\n\n# Pipe JSON to jq to extract only the full paths\nes /a-d -json *my-module*.ts | jq -r \".[].name\"\n``\n\n## CLI Help Reference\n\n\n\n\n```text\nES 1.1.0.36\nES is a command line interface to search Everything from a command prompt.\nES uses the Everything search syntax.\n\nUsage: es.exe [options] search text\nExample: ES  Everything ext:exe;ini \n\n\nSearch options\n   -r <search>, -regex <search>\n        Search using regular expressions.\n   -i, -case\n        Match case.\n   -w, -ww, -whole-word, -whole-words\n        Match whole words.\n   -p, -match-path\n        Match full path.\n   -a, -diacritics\n        Match diacritical marks.\n   -prefix\n        Match start of words.\n   -suffix\n        Match end of words.\n   -ignore-punctuation\n        Ignore punctuation in filenames.\n   -ignore-whitespace\n        Ignore whitespace in filenames.\n\n   -n <num>, -count <num>\n        Specify the maximum number of results to find.\n\n   -path <path>\n        Search for subfolders and files in path.\n   -parent-path <path>\n        Search for subfolders and files in the parent of path.\n   -parent <path>\n        Search for files with the specified parent path.\n\n   /ad\n        Folders only.\n   /a-d\n        Files only.\n   /a[RHSDAVNTPLCOIEUPM]\n        DIR style attributes search.\n        R = Read only.\n        H = Hidden.\n        S = System.\n        D = Directory.\n        A = Archive.\n        V = Device.\n        X = No scrub data.\n        N = Normal.\n        T = Temporary.\n        L = Reparse point.\n        C = Compressed.\n        O = Offline.\n        I = Not content indexed.\n        E = Encrypted.\n        U = Unpinned.\n        P = Pinned.\n        M = Recall on data access.\n        - = Prefix a flag with - to exclude.\n\n\nSort options\n   -s\n        Sort by full path.\n   -sort <name[-ascending|-descending]>\n        Set sort\n        name=name|path|size|extension|date-created|date-modified|date-accessed|\n        attributes|filelist-filename|run-count|date-recently-changed|date-run|\n        <property-name>\n\n   /on, /o-n, /os, /o-s, /oe, /o-e, /od, /o-d\n        DIR style sorts.\n        N = Name.\n        S = Size.\n        E = Extension.\n        D = Date modified.\n        - = Sort in descending order.\n\n\nJournal options\n   -j, -journal [filename filter]\n        Show index journal changes.\n        Any journal option below also shows journal changes.\n        Wildcards are supported in the filename filter.\n        The whole final case-insensitive filename is matched.\n        Use a path separator to match full paths and names.\n   -get-journal-id\n        Return the current journal ID.\n   -get-journal-pos\n        Return the current journal ID and next change ID.\n   -action-filter <semicolon (;) delimited list of actions>\n        Show only changes with the specified actions:\n        folder-create;folder-delete;folder-rename;folder-move;folder-modify;\n        file-create;file-delete;file-rename;file-move;file-modify\n   -watch\n        Return when a match is found and display the journal position.\n\n   -from-journal-pos <journal-id> <change-id>\n   -from-journal-id <journal-id>\n   -from-change-id <change-id>\n        Show changes from the specified journal-id and change-id.\n   -from-date <date>\n        Show changes starting from the specified ISO-8601 date.\n   -from-yesterday\n        Show changes starting from the beginning of yesterday.\n   -from-today\n        Show changes starting from the beginning of today.\n   -from-now\n        Show changes starting from the current time.\n\n   -to-journal-pos <journal-id> <change-id>\n   -to-journal-id <journal-id>\n   -to-change-id <change-id>\n        Show changes until the specified journal-id and change-id (exclusive).\n   -to-date <date>\n        Show changes until the specified ISO-8601 date (exclusive).\n   -to-today\n        Show changes until the start of today (exclusive).\n   -to-tomorrow\n        Show changes until the start of tomorrow (exclusive).\n   -to-now\n        Show changes until the current time (exclusive).\n\n   -after-journal-pos <journal-id> <change-id>\n        Show changes after the specified journal-id and change-id.\n   -changed-today\n        Show changes from the start of today until the start of tomorrow.\n        Same as -from-today -to-tomorrow\n   -changed-yesterday\n        Show changes from the start of yesterday until the start of today.\n        Same as -from-yesterday -to-today\n\n\nDisplay options\n   -name\n   -path-column\n   -full-path-and-name, -filename-column\n   -extension, -ext\n   -size\n   -date-created, -dc\n   -date-modified, -dm\n   -date-accessed, -da\n   -attributes, -attribs, -attrib\n   -filelist-filename\n   -run-count\n   -date-run\n   -date-recently-changed, -rc\n   -<property-name>\n   -add-columns <property-name;property-name2;...>\n        Show the specified column.\n\n   -highlight\n        Highlight results.\n   -highlight-color <color>\n        Highlight color 0x00-0xff.\n\n   -viewport-offset <offset>\n        Show results starting from offset.\n   -viewport-count <num>\n        Limit the number of results shown to <num>.\n\n   -csv\n   -efu\n   -json\n   -m3u\n   -m3u8\n   -tsv\n   -txt\n        Change display format.\n\n   -size-format <format>\n        0=auto, 1=Bytes, 2=KB, 3=MB.\n   -date-format <format>\n        0=auto, 1=ISO-8601, 2=FILETIME, 3=ISO-8601(UTC), 4=User Locale,\n        5=ISO-8601 (full resolution), 6=ISO-8601(UTC) (full resolution)\n\n   -filename-color <color>\n   -name-color <color>\n   -path-color <color>\n   -extension-color <color>\n   -size-color <color>\n   -date-created-color <color>, -dc-color <color>\n   -date-modified-color <color>, -dm-color <color>\n   -date-accessed-color <color>, -da-color <color>\n   -attributes-color <color>\n   -file-list-filename-color <color>\n   -run-count-color <color>\n   -date-run-color <color>\n   -date-recently-changed-color <color>, -rc-color <color>\n   -add-column-colors <property-name=color;property-name2=color;...>\n        Set the column color 0x00-0xff.\n\n   -filename-width <width>\n   -name-width <width>\n   -path-width <width>\n   -extension-width <width>\n   -size-width <width>\n   -date-created-width <width>, -dc-width <width>\n   -date-modified-width <width>, -dm-width <width>\n   -date-accessed-width <width>, -da-width <width>\n   -attributes-width <width>\n   -file-list-filename-width <width>\n   -run-count-width <width>\n   -date-run-width <width>\n   -date-recently-changed-width <width>, -rc-width <width>\n   -add-column-widths <property-name=width;property-name2=width;...>\n        Set the column width 0-65535.\n\n   -no-digit-grouping\n        Don't group numbers with commas.\n   -double-quote\n        Wrap paths and filenames with double quotes.\n\n\nExport options\n   -export-csv <out.csv>\n   -export-efu <out.efu>\n   -export-json <out.json>\n   -export-m3u <out.m3u>\n   -export-m3u8 <out.m3u8>\n   -export-tsv <out.txt>\n   -export-txt <out.txt>\n        Export to a file using the specified layout.\n   -no-header\n        Do not output a column header for CSV, EFU and TSV files.\n   -no-folder-append-path-separator\n        Don't append a trailing path separator to folder paths.\n   -utf8-bom\n        Store a UTF-8 byte order mark at the start of the exported file.\n\n\nGeneral options\n   -h, -help\n        Display this help.\n\n   -instance <name>\n        Connect to the unique Everything instance name.\n   -ipc1, -ipc2, -ipc3\n        Use IPC version 1, 2 or 3.\n   -pause, -more\n        Pause after each page of output.\n   -timeout <milliseconds>\n        Timeout after the specified number of milliseconds to wait for\n        the Everything database to load before sending a query.\n\n   -set-run-count <filename> <count>\n        Set the run count for the specified filename.\n   -inc-run-count <filename>\n        Increment the run count for the specified filename by one.\n   -get-run-count <filename>\n        Display the run count for the specified filename.\n\n   -get-result-count\n        Display the result count for the specified search.\n   -get-total-size\n        Display the total result size for the specified search.\n   -get-folder-size <filename>\n        Display the total folder size for the specified filename.\n\n   -save-settings\n        Save settings to %APPDATA%\\voidtools\\es\\es.ini\n   -clear-settings\n        Delete %APPDATA%\\voidtools\\es\\es.ini\n\n   -version\n        Display ES major.minor.revision.build version and exit.\n   -get-everything-version\n        Display Everything major.minor.revision.build version and exit.\n   -exit\n        Exit Everything.\n        Returns after Everything process closes.\n   -save-db\n        Save the Everything database to disk.\n        Returns after saving completes.\n   -reindex\n        Force Everything to reindex.\n        Returns after indexing completes.\n   -no-result-error\n        Set the error level if no results are found.\n\n\nNotes \n    Internal -'s in options can be omitted, eg: -nodigitgrouping\n    Switches can start with a / instead of -\n    Use double quotes to escape spaces and switches.\n    Switches can be disabled by prefixing them with no-, eg: -no-size.\n    -instance=1.5a is the same as -instance 1.5a\n    Use a ^ prefix or wrap with double quotes (\") to escape \\ & | > < ^\n",
      language: "bash",
      type: "codeBlock"
    }
  ] as MarkdownBlock[],
  description:
    "Explains how to use Everything Search (es) CLI for instantaneous filesystem lookups, including fast path resolution, JSON output, and fallbacks.",
  name: "everything-search"
});
