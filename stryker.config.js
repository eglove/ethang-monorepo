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
    "apps/*/src/**/*.tsx"
  ],
  reporters: ["progress", "clear-text", "html"],
  tsconfigFile: "tsconfig.stryker.json",
  "typescriptChecker": {
    "prioritizePerformanceOverAccuracy": true
  }
};
