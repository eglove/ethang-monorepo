import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import map from "lodash/map.js";
import replace from "lodash/replace.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import trim from "lodash/trim.js";
import { execSync } from "node:child_process";

execSync("fnm install lts-latest", { stdio: "inherit" });
execSync("fnm default lts-latest", { stdio: "inherit" });
execSync("fnm use lts-latest", { stdio: "inherit" });

const versions = execSync("fnm list", { encoding: "utf8" });

const oldVersions = filter(
  map(split(versions, "\n"), (line) => {
    return trim(replace(line, "*", ""));
  }),
  (item) => {
    return startsWith(item, "v") && !includes(item, "default");
  },
);

for (const oldVersion of oldVersions) {
  try {
    execSync(`fnm uninstall ${oldVersion}`, { stdio: "inherit" });
  } catch {
    // do nothing, this likely means process is still locked
  }
}
