---
description: Explains how to use the jq JSON processor for slicing, filtering, mapping, and formatting JSON files.
name: jq
---

# jq Skill Guide

`jq` is a lightweight and flexible command-line JSON processor. It is incredibly useful for slicing, filtering, mapping, and transforming large JSON documents. 

> [!IMPORTANT]
> Within this workspace, use `jq` to filter and pluck JSON structures locally, streaming only the relevant subsets to the model context.

## Table of Contents

* [Basic Selection](#basic-selection)
- [Pluck a Specific Object Key](#pluck-a-specific-object-key)
- [Nested Key Selection](#nested-key-selection)
* [Extracting Raw Text](#extracting-raw-text)
- [Raw Output (`-r`)](#raw-output--r---raw-output)
* [Array Operations](#array-operations)
- [Extract Array Elements](#extract-array-elements)
- [Map Array to Specific Keys](#map-array-to-specific-keys)
- [Rebuild an Array of Mapped Objects](#rebuild-an-array-of-mapped-objects)
* [Filtering and Selecting](#filtering-and-selecting)
- [Filter Array Elements by Condition](#filter-array-elements-by-condition-select)
- [Filter by Array Inclusion](#filter-by-array-inclusion)
* [Advanced Formatting](#advanced-formatting)
- [Minify JSON (`-c`)](#minify-json--c---compact-output)
- [Check if Key Exists](#check-if-key-exists-has)

## Basic Selection

### Pluck a Specific Object Key

Extract a single key from a JSON object.
**Example Usage:**

```bash
jq ".dependencies" package.json
```

### Nested Key Selection

Drill down into nested objects.
**Example Usage:**

```bash
jq ".scripts.build" package.json
```

## Extracting Raw Text

### Raw Output (`-r`, `--raw-output`)

Outputs strings without JSON quotes (e.g., `value` instead of `"value"`). This is extremely useful for passing values to other shell commands.
**Example Usage:**

```bash
jq -r ".name" package.json
```

## Array Operations

### Extract Array Elements

Output all elements of an array.
**Example Usage:**

```bash
jq ".items[]" data.json
```

### Map Array to Specific Keys

If you have an array of objects and only want one field from each, you can map over them.
**Example Usage:**

```bash
jq ".[] | .name" packages.json
```

### Rebuild an Array of Mapped Objects

If you want to construct a new array containing only a subset of keys from each item.
**Example Usage:**

```bash
jq "[ .[] | { name: .name, version: .version } ]" packages.json
```

## Filtering and Selecting

### Filter Array Elements by Condition (`select`)

Extract elements from an array that match a specific condition.
**Example Usage:**

```bash
# Find objects where the "name" property matches "target-package"
jq ".[] | select(.name == \\"target-package\\")" packages.json
```

### Filter by Array Inclusion

Filter objects where a property contains a specific value.
**Example Usage:**

```bash
jq ".[] | select(.tags[] | contains(\\"frontend\\"))" data.json
```

## Advanced Formatting

### Minify JSON (`-c`, `--compact-output`)

Output each JSON object on a single line instead of pretty-printing it. This is highly recommended when returning arrays of objects to conserve vertical space.
**Example Usage:**

```bash
jq -c ".[]" data.json
```

### Check if Key Exists (`has`)

Check whether an object has a specific key (returns a boolean).
**Example Usage:**

```bash
jq "has(\\"devDependencies\\")" package.json
``

## CLI Help Reference




```text
jq - commandline JSON processor [version 1.8.1]

Usage:	jq [options] <jq filter> [file...]
	jq [options] --args <jq filter> [strings...]
	jq [options] --jsonargs <jq filter> [JSON_TEXTS...]

jq is a tool for processing JSON inputs, applying the given filter to
its JSON text inputs and producing the filter's results as JSON on
standard output.

The simplest filter is ., which copies jq's input to its output
unmodified except for formatting. For more advanced filters see
the jq(1) manpage ("man jq") and/or https://jqlang.org/.

Example:

	$ echo '{"foo": 0}' | jq .
	{
	  "foo": 0
	}

Command options:
  -n, --null-input          use `null` as the single input value;
  -R, --raw-input           read each line as string instead of JSON;
  -s, --slurp               read all inputs into an array and use it as
                            the single input value;
  -c, --compact-output      compact instead of pretty-printed output;
  -r, --raw-output          output strings without escapes and quotes;
      --raw-output0         implies -r and output NUL after each output;
  -j, --join-output         implies -r and output without newline after
                            each output;
  -a, --ascii-output        output strings by only ASCII characters
                            using escape sequences;
  -S, --sort-keys           sort keys of each object on output;
  -C, --color-output        colorize JSON output;
  -M, --monochrome-output   disable colored output;
      --tab                 use tabs for indentation;
      --indent n            use n spaces for indentation (max 7 spaces);
      --unbuffered          flush output stream after each output;
      --stream              parse the input value in streaming fashion;
      --stream-errors       implies --stream and report parse error as
                            an array;
      --seq                 parse input/output as application/json-seq;
  -f, --from-file           load the filter from a file;
  -L, --library-path dir    search modules from the directory;
      --arg name value      set $name to the string value;
      --argjson name value  set $name to the JSON value;
      --slurpfile name file set $name to an array of JSON values read
                            from the file;
      --rawfile name file   set $name to string contents of file;
      --args                consume remaining arguments as positional
                            string values;
      --jsonargs            consume remaining arguments as positional
                            JSON values;
  -e, --exit-status         set exit status code based on the output;
  -b, --binary              open input/output streams in binary mode;
  -V, --version             show the version;
  --build-configuration     show jq's build configuration;
  -h, --help                show the help;
  --                        terminates argument processing;

Named arguments are also available as $ARGS.named[], while
positional arguments are available as $ARGS.positional[].

```
