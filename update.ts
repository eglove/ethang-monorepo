import { execSync } from "child_process";
import { chdir } from "node:process";

const runCommand = (
  command: string,
  stdio: "overlapped" | "pipe" | "ignore" | "inherit" = "inherit",
) => {
  return execSync(command, { stdio, encoding: "utf8" });
};

const runIn = (
  directory: string,
  callback: () => void,
  returnDirectory: string,
) => {
  chdir(directory);
  callback();
  chdir(returnDirectory);
};

const runCommandInEslint = (command: string) => {
  runIn("packages\\eslint-config\\", () => runCommand(command), "..\\..\\");
};

runCommand("pnpm --filter eslint-config up -i --latest");
runCommand("pnpm --filter eslint-config build");

const eslintGitStatus = runCommand(
  "git status --porcelain -- packages\\eslint-config\\",
  "pipe",
);
const changeLength = eslintGitStatus.split("\n").filter(Boolean).length;

if (changeLength > 1) {
  runCommandInEslint("npm version minor");
} else if (changeLength === 1) {
  runCommandInEslint("npm version patch");
}

if (changeLength > 0) {
  runCommand("pnpm --filter build eslint-config");
  runCommandInEslint("npm publish");
}

runCommand("git add .");
runCommand("git commit -m 'Update EsLint Config'");
runCommand("git push");
