export default {
  testRunner: "vitest",
  checkers: ["typescript"],
  plugins: ["@stryker-mutator/vitest-runner", "@stryker-mutator/typescript-checker"],
  coverageAnalysis: "all",
  incremental: true,
  mutate: [
    "packages/*/src/**/*.ts",
    "packages/*/src/**/*.tsx",
    "apps/*/src/**/*.ts",
    "apps/*/src/**/*.tsx",

    "!packages/*/src/**/*.spec.ts",
    "!packages/*/src/**/*.test.ts",
    "!packages/*/src/**/*.spec.tsx",
    "!packages/*/src/**/*.test.tsx",
    "!apps/*/src/**/*.spec.ts",
    "!apps/*/src/**/*.test.ts",
    "!apps/*/src/**/*.spec.tsx",
    "!apps/*/src/**/*.test.tsx"
  ],
  mutationScoreThresholds: {
    break: 50,
  },
  reporters: ["progress", "clear-text", "html"],
  tsconfigFile: "tsconfig.stryker.json",
  "typescriptChecker": {
    "prioritizePerformanceOverAccuracy": true
  }
};
