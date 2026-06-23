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
      exclude: ["**/*.mock.ts", "src/db/database-schema.ts"],
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 99.61,
        functions: 100,
        lines: 99.76,
        statements: 99.76
      }
    },
    environment: "node"
  }
});
