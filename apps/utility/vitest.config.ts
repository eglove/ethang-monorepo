import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    reporters: [
      "default",
      ["json", { outputFile: "./parse-results/results.json" }],
      ["html", { outputFile: "./public/index.html" }],
    ],
  },
});
