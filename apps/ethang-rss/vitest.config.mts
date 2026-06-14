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
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      thresholds: {
        autoUpdate: true,
        branches: 100,
        functions: 65.71,
        lines: 94.39,
        statements: 94.39
      }
    },
    environment: "node"
  }
});
