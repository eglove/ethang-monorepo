// Anchor file for RuleTester cases that need type information but should
// not contain any slice calls that the rule would match and autofix.
const arr: number[] = [1, 2, 3];

void arr;
