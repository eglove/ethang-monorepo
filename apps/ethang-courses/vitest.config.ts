import endsWith from "lodash/endsWith.js";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "graphql-loader",
      transform(code, id) {
        if (endsWith(id, ".graphql")) {
          return {
            code: `export default ${JSON.stringify(code)};`,
            map: null
          };
        }
        return null;
      }
    }
  ],
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 100,
        functions: 98.43,
        lines: 99.4,
        statements: 99.4
      }
    },
    environment: "node",
    include: ["src/**/*.test.ts"]
  }
});
