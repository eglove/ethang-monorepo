import { execSync } from "node:child_process";

const inherit = { stdio: "inherit" };
const getReturn = { encoding: "utf8" };

execSync("fnm install lts-latest", inherit);
execSync(`fnm default lts-latest`, inherit);
execSync(`fnm use lts-latest`, inherit);

const versions = execSync("fnm list", getReturn);

const oldVersions = versions
  .split("\n")
  .map((line) => line.replace("*", "").trim())
  .filter((item) => {
    return item.startsWith("v") && !item.includes("default");
  });

for (const oldVersion of oldVersions) {
  try {
    execSync(`fnm uninstall ${oldVersion}`, inherit);
  } catch {
    // do nothing, this likely means process is still locked
  }
}
