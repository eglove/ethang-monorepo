import { chainStyleRule } from "./rules/chain-style.ts";
import { chainingRule } from "./rules/chaining.ts";
import { consistentComposeRule } from "./rules/consistent-compose.ts";
import { identityShorthandRule } from "./rules/identity-shorthand.ts";
import { importScopeRule } from "./rules/import-scope.ts";
import { matchesPropertyShorthandRule } from "./rules/matches-property-shorthand.ts";
import { matchesShorthandRule } from "./rules/matches-shorthand.ts";
import { noBarrelFileRule } from "./rules/no-barrel-file.ts";
import { noCollectionIssuesRule } from "./rules/no-collection-issues.ts";
import { noExplicitReturnTypeRule } from "./rules/no-explicit-return-type.ts";
import { noLodashMisuseRule } from "./rules/no-lodash-misuse.ts";
import { noNullUndefinedCheckRule } from "./rules/no-null-undefined-check.ts";
import { noTryCatchRule } from "./rules/no-try-catch.ts";
import { pathStyleRule } from "./rules/path-style.ts";
import { preferEffectArrayIntersperseRule } from "./rules/prefer-effect-array-intersperse.ts";
import { preferEffectArrayScanRule } from "./rules/prefer-effect-array-scan.ts";
import { preferEffectBigIntClampRule } from "./rules/prefer-effect-bigint-clamp.ts";
import { preferEffectDateTimeRule } from "./rules/prefer-effect-datetime.ts";
import { preferEffectEncodingBase64Rule } from "./rules/prefer-effect-encoding-base64.ts";
import { preferEffectEqualRule } from "./rules/prefer-effect-equal.ts";
import { preferEffectLogRule } from "./rules/prefer-effect-log.ts";
import { preferEffectNumberParseRule } from "./rules/prefer-effect-number-parse.ts";
import { preferEffectPredicateIsIterableRule } from "./rules/prefer-effect-predicate-is-iterable.ts";
import { preferEffectPredicateRule } from "./rules/prefer-effect-predicate.ts";
import { preferLodashClampRule } from "./rules/prefer-lodash-clamp.ts";
import { preferLodashCountByRule } from "./rules/prefer-lodash-count-by.ts";
import { preferLodashDifferenceRule } from "./rules/prefer-lodash-difference.ts";
import { preferLodashEscapeRegexpRule } from "./rules/prefer-lodash-escape-regexp.ts";
import { preferLodashFindKeyRule } from "./rules/prefer-lodash-find-key.ts";
import { preferLodashFromPairsRule } from "./rules/prefer-lodash-from-pairs.ts";
import { preferLodashGroupByRule } from "./rules/prefer-lodash-group-by.ts";
import { preferLodashIntersectionRule } from "./rules/prefer-lodash-intersection.ts";
import { preferLodashKeyByRule } from "./rules/prefer-lodash-key-by.ts";
import { preferLodashMapKeysRule } from "./rules/prefer-lodash-map-keys.ts";
import { preferLodashMapValuesRule } from "./rules/prefer-lodash-map-values.ts";
import { preferLodashSliceRule } from "./rules/prefer-lodash-slice.ts";
import { preferLodashUnionRule } from "./rules/prefer-lodash-union.ts";
import { preferLodashUniqRule } from "./rules/prefer-lodash-uniq.ts";
import { preferLodashRule } from "./rules/prefer-lodash.ts";
import { preferredAliasRule } from "./rules/preferred-alias.ts";
import { propertyShorthandRule } from "./rules/property-shorthand.ts";
import { unwrapRule } from "./rules/unwrap.ts";
import { validateUnknownRule } from "./rules/validate-unknown.ts";

export const rules = {
  "chain-style": chainStyleRule,
  chaining: chainingRule,
  "consistent-compose": consistentComposeRule,
  "identity-shorthand": identityShorthandRule,
  "import-scope": importScopeRule,
  "matches-property-shorthand": matchesPropertyShorthandRule,
  "matches-shorthand": matchesShorthandRule,
  "no-barrel-file": noBarrelFileRule,
  "no-collection-issues": noCollectionIssuesRule,
  "no-explicit-return-type": noExplicitReturnTypeRule,
  "no-lodash-misuse": noLodashMisuseRule,
  "no-null-undefined-check": noNullUndefinedCheckRule,
  "no-try-catch": noTryCatchRule,
  "path-style": pathStyleRule,
  "prefer-effect-array-intersperse": preferEffectArrayIntersperseRule,
  "prefer-effect-array-scan": preferEffectArrayScanRule,
  "prefer-effect-bigint-clamp": preferEffectBigIntClampRule,
  "prefer-effect-datetime": preferEffectDateTimeRule,
  "prefer-effect-encoding-base64": preferEffectEncodingBase64Rule,
  "prefer-effect-equal": preferEffectEqualRule,
  "prefer-effect-log": preferEffectLogRule,
  "prefer-effect-number-parse": preferEffectNumberParseRule,
  "prefer-effect-predicate": preferEffectPredicateRule,
  "prefer-effect-predicate-is-iterable": preferEffectPredicateIsIterableRule,
  "prefer-lodash": preferLodashRule,
  "prefer-lodash-clamp": preferLodashClampRule,
  "prefer-lodash-count-by": preferLodashCountByRule,
  "prefer-lodash-difference": preferLodashDifferenceRule,
  "prefer-lodash-escape-regexp": preferLodashEscapeRegexpRule,
  "prefer-lodash-find-key": preferLodashFindKeyRule,
  "prefer-lodash-from-pairs": preferLodashFromPairsRule,
  "prefer-lodash-group-by": preferLodashGroupByRule,
  "prefer-lodash-intersection": preferLodashIntersectionRule,
  "prefer-lodash-key-by": preferLodashKeyByRule,
  "prefer-lodash-mapKeys": preferLodashMapKeysRule,
  "prefer-lodash-mapValues": preferLodashMapValuesRule,
  "prefer-lodash-slice": preferLodashSliceRule,
  "prefer-lodash-union": preferLodashUnionRule,
  "prefer-lodash-uniq": preferLodashUniqRule,
  "preferred-alias": preferredAliasRule,
  "property-shorthand": propertyShorthandRule,
  unwrap: unwrapRule,
  "validate-unknown": validateUnknownRule
} as const;

export const plugin = {
  meta: {
    name: "@ethang/eslint-plugin",
    version: "0.0.0"
  },
  rules
} as const;

export default plugin;

export { chainStyleRule } from "./rules/chain-style.ts";
export { chainingRule } from "./rules/chaining.ts";
export { consistentComposeRule } from "./rules/consistent-compose.ts";
export { identityShorthandRule } from "./rules/identity-shorthand.ts";
export { importScopeRule } from "./rules/import-scope.ts";
export { matchesPropertyShorthandRule } from "./rules/matches-property-shorthand.ts";
export { matchesShorthandRule } from "./rules/matches-shorthand.ts";
export { noBarrelFileRule } from "./rules/no-barrel-file.ts";
export { noCollectionIssuesRule } from "./rules/no-collection-issues.ts";
export { noExplicitReturnTypeRule } from "./rules/no-explicit-return-type.ts";
export { noLodashMisuseRule } from "./rules/no-lodash-misuse.ts";
export { noNullUndefinedCheckRule } from "./rules/no-null-undefined-check.ts";
export { noTryCatchRule } from "./rules/no-try-catch.ts";
export { pathStyleRule } from "./rules/path-style.ts";
export { preferEffectArrayIntersperseRule } from "./rules/prefer-effect-array-intersperse.ts";
export { preferEffectArrayScanRule } from "./rules/prefer-effect-array-scan.ts";
export { preferEffectBigIntClampRule } from "./rules/prefer-effect-bigint-clamp.ts";
export { preferEffectDateTimeRule } from "./rules/prefer-effect-datetime.ts";
export { preferEffectEncodingBase64Rule } from "./rules/prefer-effect-encoding-base64.ts";
export { preferEffectEqualRule } from "./rules/prefer-effect-equal.ts";
export { preferEffectLogRule } from "./rules/prefer-effect-log.ts";
export { preferEffectNumberParseRule } from "./rules/prefer-effect-number-parse.ts";
export { preferEffectPredicateIsIterableRule } from "./rules/prefer-effect-predicate-is-iterable.ts";
export { preferEffectPredicateRule } from "./rules/prefer-effect-predicate.ts";
export { preferLodashClampRule } from "./rules/prefer-lodash-clamp.ts";
export { preferLodashCountByRule } from "./rules/prefer-lodash-count-by.ts";
export { preferLodashDifferenceRule } from "./rules/prefer-lodash-difference.ts";
export { preferLodashEscapeRegexpRule } from "./rules/prefer-lodash-escape-regexp.ts";
export { preferLodashFindKeyRule } from "./rules/prefer-lodash-find-key.ts";
export { preferLodashFromPairsRule } from "./rules/prefer-lodash-from-pairs.ts";
export { preferLodashGroupByRule } from "./rules/prefer-lodash-group-by.ts";
export { preferLodashIntersectionRule } from "./rules/prefer-lodash-intersection.ts";
export { preferLodashKeyByRule } from "./rules/prefer-lodash-key-by.ts";
export { preferLodashMapKeysRule } from "./rules/prefer-lodash-map-keys.ts";
export { preferLodashMapValuesRule } from "./rules/prefer-lodash-map-values.ts";
export { preferLodashSliceRule } from "./rules/prefer-lodash-slice.ts";
export { preferLodashUnionRule } from "./rules/prefer-lodash-union.ts";
export { preferLodashUniqRule } from "./rules/prefer-lodash-uniq.ts";
export { preferLodashRule } from "./rules/prefer-lodash.ts";
export { preferredAliasRule } from "./rules/preferred-alias.ts";
export { propertyShorthandRule } from "./rules/property-shorthand.ts";
export { unwrapRule } from "./rules/unwrap.ts";
export { validateUnknownRule } from "./rules/validate-unknown.ts";

export {
  effectApi,
  effectBigIntApi,
  effectDateTimeApi,
  effectDurationApi,
  effectEncodingApi,
  effectNumberApi,
  effectPredicateApi,
  effectRedactedApi,
  effectStringApi,
  isEffectApiMethod,
  isEffectBigIntApiName,
  isEffectDateTimeApiKey,
  isEffectDurationApiName,
  isEffectEncodingApiName,
  isEffectNumberApiName,
  isEffectPredicateApiName,
  isEffectRedactedApiName,
  isEffectStringApiName
} from "./utils/effect-api.ts";
export { isBarrelFilename, isInsideNodeModules } from "./utils/file.ts";
export {
  isLodashFunction,
  isRuntimeOnlyLodashMethod,
  lodashApi
} from "./utils/lodash-api.ts";
