import { chainStyleRule } from "./rules/chain-style.ts";
import { chainingRule } from "./rules/chaining.ts";
import { consistentComposeRule } from "./rules/consistent-compose.ts";
import { identityShorthandRule } from "./rules/identity-shorthand.ts";
import { importScopeRule } from "./rules/import-scope.ts";
import { matchesPropertyShorthandRule } from "./rules/matches-property-shorthand.ts";
import { matchesShorthandRule } from "./rules/matches-shorthand.ts";
import { noBarrelFileRule } from "./rules/no-barrel-file.ts";
import { noCollectionIssuesRule } from "./rules/no-collection-issues.ts";
import { noLodashMisuseRule } from "./rules/no-lodash-misuse.ts";
import { noNullUndefinedCheckRule } from "./rules/no-null-undefined-check.ts";
import { noRedundantExplicitReturnTypeRule } from "./rules/no-redundant-explicit-return-type.ts";
import { noTryCatchRule } from "./rules/no-try-catch.ts";
import { pathStyleRule } from "./rules/path-style.ts";
import { preferEffectRule } from "./rules/prefer-effect.ts";
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
  "no-lodash-misuse": noLodashMisuseRule,
  "no-null-undefined-check": noNullUndefinedCheckRule,
  "no-redundant-explicit-return-type": noRedundantExplicitReturnTypeRule,
  "no-try-catch": noTryCatchRule,
  "path-style": pathStyleRule,
  "prefer-effect": preferEffectRule,
  "prefer-lodash": preferLodashRule,
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
export { noLodashMisuseRule } from "./rules/no-lodash-misuse.ts";
export { noNullUndefinedCheckRule } from "./rules/no-null-undefined-check.ts";
export { noRedundantExplicitReturnTypeRule } from "./rules/no-redundant-explicit-return-type.ts";
export { noTryCatchRule } from "./rules/no-try-catch.ts";
export { pathStyleRule } from "./rules/path-style.ts";
export { preferEffectRule } from "./rules/prefer-effect.ts";
export { preferLodashRule } from "./rules/prefer-lodash.ts";
export { preferredAliasRule } from "./rules/preferred-alias.ts";
export { propertyShorthandRule } from "./rules/property-shorthand.ts";
export { unwrapRule } from "./rules/unwrap.ts";
export { validateUnknownRule } from "./rules/validate-unknown.ts";

export {
  effectApi,
  effectCoreMethods,
  isEffectApiMethod,
  isEffectCoreMethod
} from "./utils/effect-api.ts";
export { isBarrelFilename, isInsideNodeModules } from "./utils/file.ts";
export { isLodashFunction, lodashApi } from "./utils/lodash-api.ts";
