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
      thresholds: {
        branches: 37.3,
        functions: 7.57,
        lines: 27.1,
        statements: 27.1
      }
    },
    environment: "node"
  }
});
