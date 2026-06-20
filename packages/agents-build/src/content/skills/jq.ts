import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

import { defineSkill } from "../../define.ts";

export const jq = defineSkill({
  content: [
    {
      level: 1,
      text: "jq Skill Guide",
      type: "header"
    },
    {
      text: "`jq` is a lightweight and flexible command-line JSON processor. It is incredibly useful for slicing, filtering, mapping, and transforming large JSON documents. ",
      type: "text"
    },
    {
      text: "[!IMPORTANT]\nWithin this workspace, directly viewing large JSON configuration files exhausts the model token budget. You must ALWAYS use `jq` (prefixed with `rtk`) to filter and pluck JSON structures locally, streaming only the relevant subsets to the model context.",
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
          text: "[Basic Selection](#basic-selection)\n- [Pluck a Specific Object Key](#pluck-a-specific-object-key)\n- [Nested Key Selection](#nested-key-selection)"
        },
        {
          text: "[Extracting Raw Text](#extracting-raw-text)\n- [Raw Output (`-r`)](#raw-output--r---raw-output)"
        },
        {
          text: "[Array Operations](#array-operations)\n- [Extract Array Elements](#extract-array-elements)\n- [Map Array to Specific Keys](#map-array-to-specific-keys)\n- [Rebuild an Array of Mapped Objects](#rebuild-an-array-of-mapped-objects)"
        },
        {
          text: "[Filtering and Selecting](#filtering-and-selecting)\n- [Filter Array Elements by Condition](#filter-array-elements-by-condition-select)\n- [Filter by Array Inclusion](#filter-by-array-inclusion)"
        },
        {
          text: "[Advanced Formatting](#advanced-formatting)\n- [Minify JSON (`-c`)](#minify-json--c---compact-output)\n- [Check if Key Exists](#check-if-key-exists-has)"
        }
      ],
      type: "unorderedList"
    },
    {
      level: 2,
      text: "Basic Selection",
      type: "header"
    },
    {
      level: 3,
      text: "Pluck a Specific Object Key",
      type: "header"
    },
    {
      text: "Extract a single key from a JSON object.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rtk jq ".dependencies" package.json',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Nested Key Selection",
      type: "header"
    },
    {
      text: "Drill down into nested objects.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rtk jq ".scripts.build" package.json',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Extracting Raw Text",
      type: "header"
    },
    {
      level: 3,
      text: "Raw Output (`-r`, `--raw-output`)",
      type: "header"
    },
    {
      text: 'Outputs strings without JSON quotes (e.g., `value` instead of `"value"`). This is extremely useful for passing values to other shell commands.\n**Example Usage:**',
      type: "text"
    },
    {
      code: 'rtk jq -r ".name" package.json',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Array Operations",
      type: "header"
    },
    {
      level: 3,
      text: "Extract Array Elements",
      type: "header"
    },
    {
      text: "Output all elements of an array.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rtk jq ".items[]" data.json',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Map Array to Specific Keys",
      type: "header"
    },
    {
      text: "If you have an array of objects and only want one field from each, you can map over them.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rtk jq ".[] | .name" packages.json',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Rebuild an Array of Mapped Objects",
      type: "header"
    },
    {
      text: "If you want to construct a new array containing only a subset of keys from each item.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rtk jq "[ .[] | { name: .name, version: .version } ]" packages.json',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Filtering and Selecting",
      type: "header"
    },
    {
      level: 3,
      text: "Filter Array Elements by Condition (`select`)",
      type: "header"
    },
    {
      text: "Extract elements from an array that match a specific condition.\n**Example Usage:**",
      type: "text"
    },
    {
      code: '# Find objects where the "name" property matches "target-package"\nrtk jq ".[] | select(.name == \\\\"target-package\\\\")" packages.json',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Filter by Array Inclusion",
      type: "header"
    },
    {
      text: "Filter objects where a property contains a specific value.\n**Example Usage:**",
      type: "text"
    },
    {
      code: String.raw`rtk jq ".[] | select(.tags[] | contains(\\"frontend\\"))" data.json`,
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 2,
      text: "Advanced Formatting",
      type: "header"
    },
    {
      level: 3,
      text: "Minify JSON (`-c`, `--compact-output`)",
      type: "header"
    },
    {
      text: "Output each JSON object on a single line instead of pretty-printing it. This is highly recommended when returning arrays of objects to conserve vertical space.\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rtk jq -c ".[]" data.json',
      language: "bash",
      type: "codeBlock"
    },
    {
      level: 3,
      text: "Check if Key Exists (`has`)",
      type: "header"
    },
    {
      text: "Check whether an object has a specific key (returns a boolean).\n**Example Usage:**",
      type: "text"
    },
    {
      code: 'rtk jq "has(\\\\"devDependencies\\\\")" package.json\n``\n\n## CLI Help Reference\n\n\n\n\n```text\njq - commandline JSON processor [version 1.8.1]\n\nUsage:\tjq [options] <jq filter> [file...]\n\tjq [options] --args <jq filter> [strings...]\n\tjq [options] --jsonargs <jq filter> [JSON_TEXTS...]\n\njq is a tool for processing JSON inputs, applying the given filter to\nits JSON text inputs and producing the filter\'s results as JSON on\nstandard output.\n\nThe simplest filter is ., which copies jq\'s input to its output\nunmodified except for formatting. For more advanced filters see\nthe jq(1) manpage ("man jq") and/or https://jqlang.org/.\n\nExample:\n\n\t$ echo \'{"foo": 0}\' | jq .\n\t{\n\t  "foo": 0\n\t}\n\nCommand options:\n  -n, --null-input          use `null` as the single input value;\n  -R, --raw-input           read each line as string instead of JSON;\n  -s, --slurp               read all inputs into an array and use it as\n                            the single input value;\n  -c, --compact-output      compact instead of pretty-printed output;\n  -r, --raw-output          output strings without escapes and quotes;\n      --raw-output0         implies -r and output NUL after each output;\n  -j, --join-output         implies -r and output without newline after\n                            each output;\n  -a, --ascii-output        output strings by only ASCII characters\n                            using escape sequences;\n  -S, --sort-keys           sort keys of each object on output;\n  -C, --color-output        colorize JSON output;\n  -M, --monochrome-output   disable colored output;\n      --tab                 use tabs for indentation;\n      --indent n            use n spaces for indentation (max 7 spaces);\n      --unbuffered          flush output stream after each output;\n      --stream              parse the input value in streaming fashion;\n      --stream-errors       implies --stream and report parse error as\n                            an array;\n      --seq                 parse input/output as application/json-seq;\n  -f, --from-file           load the filter from a file;\n  -L, --library-path dir    search modules from the directory;\n      --arg name value      set $name to the string value;\n      --argjson name value  set $name to the JSON value;\n      --slurpfile name file set $name to an array of JSON values read\n                            from the file;\n      --rawfile name file   set $name to string contents of file;\n      --args                consume remaining arguments as positional\n                            string values;\n      --jsonargs            consume remaining arguments as positional\n                            JSON values;\n  -e, --exit-status         set exit status code based on the output;\n  -b, --binary              open input/output streams in binary mode;\n  -V, --version             show the version;\n  --build-configuration     show jq\'s build configuration;\n  -h, --help                show the help;\n  --                        terminates argument processing;\n\nNamed arguments are also available as $ARGS.named[], while\npositional arguments are available as $ARGS.positional[].\n',
      language: "bash",
      type: "codeBlock"
    }
  ] as MarkdownBlock[],
  description:
    "Explains how to use the jq JSON processor for slicing, filtering, mapping, and formatting JSON files, emphasizing token conservation via rtk.",
  name: "jq"
});
