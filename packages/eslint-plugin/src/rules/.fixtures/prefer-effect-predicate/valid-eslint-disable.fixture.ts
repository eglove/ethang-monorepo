// .fixture.ts — used by src/rules/prefer-effect-predicate.test.ts to validate
// that an `eslint-disable rule-to-test/prefer-effect-predicate` directive
// suppresses the diagnostic for this line.
import { Predicate } from "effect";

declare const value: unknown;

// eslint-disable-next-line rule-to-test/prefer-effect-predicate
const isBig = Predicate.isBigInt(value);
