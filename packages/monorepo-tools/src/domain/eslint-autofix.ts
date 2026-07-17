// @ts-check
/**
Diff a pre/post ESLint run produced by the Node API shim
(see `src/cli/eslint-autofix.cli.ts`) and report which messages
were silenced by `--fix` per file and per rule.

The legacy PowerShell implementation indexed post-fix messages by the tuple
`(ruleId, line, column, message)` so identical messages still
match one-for-one (not collapsed). We mirror that exactly.
*/

import { Effect, Schema } from "effect";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

const SEVERITY_ERROR = 2;
const SEVERITY_WARNING = 1;
const UNKNOWN_RULE = "<unknown>";

const AutofixMessageSchema = Schema.Struct({
  column: Schema.Number,
  fixable: Schema.Boolean,
  line: Schema.Number,
  message: Schema.String,
  ruleId: Schema.Union(Schema.Null, Schema.String),
  severity: Schema.Number
});

const AutofixFileEntrySchema = Schema.Struct({
  filePath: Schema.String,
  postFixMessages: Schema.Array(AutofixMessageSchema),
  preFixMessages: Schema.Array(AutofixMessageSchema)
});

const AutofixPayloadSchema = Schema.Struct({
  results: Schema.Array(AutofixFileEntrySchema)
});

export type AutofixFileEntry = Schema.Schema.Type<
  typeof AutofixFileEntrySchema
>;

export type AutofixMessage = Schema.Schema.Type<typeof AutofixMessageSchema>;

export type AutofixPayload = Schema.Schema.Type<typeof AutofixPayloadSchema>;

const AutofixByFileSchema = Schema.Struct({
  file: Schema.String,
  fixedByRule: Schema.Record({ key: Schema.String, value: Schema.Number }),
  fixedErrorCount: Schema.Number,
  fixedWarningCount: Schema.Number,
  unfixableButFixableCount: Schema.Number
});

const AutofixByRuleSchema = Schema.Struct({
  fileCount: Schema.Number,
  fixedErrorCount: Schema.Number,
  fixedWarningCount: Schema.Number,
  ruleId: Schema.String
});

const _AutofixSummarySchema = Schema.Struct({
  byFile: Schema.Array(AutofixByFileSchema),
  byRule: Schema.Array(AutofixByRuleSchema),
  fixedErrorCount: Schema.Number,
  fixedWarningCount: Schema.Number,
  unfixableButFixableCount: Schema.Number
});

export type AutofixSummary = Schema.Schema.Type<typeof _AutofixSummarySchema>;

const isErrorSeverity = (severity: number) => {
  return SEVERITY_ERROR === severity;
};

const isWarningSeverity = (severity: number) => {
  return SEVERITY_WARNING === severity;
};

const parseJsonPayload = (raw: string) => {
  return Effect.runSync(
    Schema.decodeUnknown(Schema.parseJson(AutofixPayloadSchema))(raw).pipe(
      Effect.mapError((error) => {
        return new Error(`eslint-autofix: ${String(error)}`);
      })
    )
  );
};

export const parseAutofixPayload = (raw: string) => {
  return parseJsonPayload(raw);
};

const messageKey = (message: AutofixMessage, ruleId: string) => {
  return `${ruleId}|${message.line}|${message.column}|${message.message}`;
};

const ruleIdOf = (message: AutofixMessage) => {
  return isNil(message.ruleId) ? UNKNOWN_RULE : message.ruleId;
};

const indexPostMessages = (post: readonly AutofixMessage[]) => {
  const counts = new Map<string, number>();
  for (const message of post) {
    const key = messageKey(message, ruleIdOf(message));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
};

const bumpSeverity = (
  target: { fixedErrorCount: number; fixedWarningCount: number },
  severity: number
) => {
  if (isErrorSeverity(severity)) {
    target.fixedErrorCount += 1;
  }
  if (isWarningSeverity(severity)) {
    target.fixedWarningCount += 1;
  }
};

type RuleAggregate = Record<string, RuleBucket>;

type RuleBucket = {
  files: Set<string>;
  fixedErrorCount: number;
  fixedWarningCount: number;
};

const bumpRuleBucket = (
  aggregate: RuleAggregate,
  ruleId: string,
  filePath: string,
  severity: number
) => {
  const existing = aggregate[ruleId];
  const bucket: RuleBucket = existing ?? {
    files: new Set<string>(),
    fixedErrorCount: 0,
    fixedWarningCount: 0
  };
  if (!existing) {
    aggregate[ruleId] = bucket;
  }
  bucket.files.add(filePath);
  bumpSeverity(bucket, severity);
};

type AutofixByFileType = Schema.Schema.Type<typeof AutofixByFileSchema>;
type AutofixByRuleType = Schema.Schema.Type<typeof AutofixByRuleSchema>;

const compareRules = (a: AutofixByRuleType, b: AutofixByRuleType) => {
  const aTotal = a.fixedErrorCount + a.fixedWarningCount;
  const bTotal = b.fixedErrorCount + b.fixedWarningCount;
  if (aTotal === bTotal) {
    return a.ruleId.localeCompare(b.ruleId);
  }
  return bTotal - aTotal;
};

type FileDiffState = {
  fixedByRule: Record<string, number>;
  totals: FileDiffTotals;
};

type FileDiffTotals = {
  fixedErrorCount: number;
  fixedWarningCount: number;
  unfixableButFixableCount: number;
};

const createFileDiffState = () => {
  return {
    fixedByRule: {} as Record<string, number>,
    totals: {
      fixedErrorCount: 0,
      fixedWarningCount: 0,
      unfixableButFixableCount: 0
    }
  };
};

const isMatched = (remaining: number) => {
  return 0 < remaining;
};

const consumeMatchedMessage = (
  state: FileDiffState,
  preMessage: AutofixMessage
) => {
  if (!preMessage.fixable) {
    return;
  }
  state.totals.unfixableButFixableCount += 1;
};

const recordFixedMessage = (
  state: FileDiffState,
  ruleId: string,
  preMessage: AutofixMessage,
  ruleAggregate: RuleAggregate,
  filePath: string
) => {
  state.fixedByRule[ruleId] = (state.fixedByRule[ruleId] ?? 0) + 1;
  bumpSeverity(state.totals, preMessage.severity);
  bumpRuleBucket(ruleAggregate, ruleId, filePath, preMessage.severity);
};

const processPreMessage = (
  preMessage: AutofixMessage,
  postIndex: Map<string, number>,
  ruleAggregate: RuleAggregate,
  state: FileDiffState,
  filePath: string
) => {
  const ruleId = ruleIdOf(preMessage);
  const key = messageKey(preMessage, ruleId);
  const remaining = postIndex.get(key) ?? 0;
  const hasMatch = isMatched(remaining);
  if (hasMatch) {
    postIndex.set(key, remaining - 1);
    consumeMatchedMessage(state, preMessage);
    return;
  }
  recordFixedMessage(state, ruleId, preMessage, ruleAggregate, filePath);
};

const computeFileSummary = (
  entry: AutofixFileEntry,
  ruleAggregate: RuleAggregate
) => {
  const postIndex = indexPostMessages(entry.postFixMessages);
  const state = createFileDiffState();
  for (const preMessage of entry.preFixMessages) {
    processPreMessage(
      preMessage,
      postIndex,
      ruleAggregate,
      state,
      entry.filePath
    );
  }
  const hasFixes =
    0 < state.totals.fixedErrorCount || 0 < state.totals.fixedWarningCount;
  const hasUnfixable = 0 < state.totals.unfixableButFixableCount;
  const byFileEntry =
    hasFixes || hasUnfixable
      ? {
          file: entry.filePath,
          fixedByRule: state.fixedByRule,
          fixedErrorCount: state.totals.fixedErrorCount,
          fixedWarningCount: state.totals.fixedWarningCount,
          unfixableButFixableCount: state.totals.unfixableButFixableCount
        }
      : null;
  return {
    byFileEntry,
    totals: state.totals
  };
};

const projectRuleAggregate = (aggregate: RuleAggregate) => {
  const rules = map(Object.entries(aggregate), ([ruleId, bucket]) => {
    return {
      fileCount: bucket.files.size,
      fixedErrorCount: bucket.fixedErrorCount,
      fixedWarningCount: bucket.fixedWarningCount,
      ruleId
    };
  });
  rules.sort(compareRules);
  return rules;
};

type ZeroTotals = {
  fixedErrorCount: number;
  fixedWarningCount: number;
  unfixableButFixableCount: number;
};

const createZeroTotals = () => {
  return {
    fixedErrorCount: 0,
    fixedWarningCount: 0,
    unfixableButFixableCount: 0
  };
};

export const summarizeAutofix = (payload: AutofixPayload) => {
  const byFile: AutofixByFileType[] = [];
  const ruleAggregate: RuleAggregate = {};
  const totals: ZeroTotals = createZeroTotals();

  for (const entry of payload.results) {
    const fileSummary = computeFileSummary(entry, ruleAggregate);
    totals.fixedErrorCount += fileSummary.totals.fixedErrorCount;
    totals.fixedWarningCount += fileSummary.totals.fixedWarningCount;
    totals.unfixableButFixableCount +=
      fileSummary.totals.unfixableButFixableCount;
    if (fileSummary.byFileEntry) {
      byFile.push(fileSummary.byFileEntry);
    }
  }

  return {
    byFile,
    byRule: projectRuleAggregate(ruleAggregate),
    fixedErrorCount: totals.fixedErrorCount,
    fixedWarningCount: totals.fixedWarningCount,
    unfixableButFixableCount: totals.unfixableButFixableCount
  };
};
