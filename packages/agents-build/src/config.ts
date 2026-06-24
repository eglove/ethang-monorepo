/**
Source-workspace vocabulary that must never reach the generated output.
Content is rewritten from a NISC/Angular workspace to this monorepo's
stack; these tripwires make the rewrite mechanically verifiable.
"Stash" stays case-sensitive so "git stash" remains legal.
*/
export const FORBIDDEN_PATTERNS: readonly {
  name: string;
  pattern: RegExp;
}[] = [
  { name: "NISC", pattern: /\bNISC\b/iu },
  { name: "Jira", pattern: /\bJira\b/iu },
  { name: "Stash", pattern: /\bStash\b/u },
  { name: "Bamboo", pattern: /\bBamboo\b/iu },
  { name: "SmartHub", pattern: /\bSmartHub\b/iu },
  { name: "SHWA", pattern: /\bSHWA?\b/u },
  { name: "iVUE", pattern: /\biVUE\b/iu },
  { name: "mcp__intellij", pattern: /mcp__intellij/iu },
  { name: "sourcebot", pattern: /\bsourcebot\b/iu },
  { name: "NGXS", pattern: /\bNGXS\b/iu },
  { name: "Angular", pattern: /\bAngular\b/iu },
  { name: "AskUserQuestion", pattern: /AskUserQuestion/u },
  { name: "subagent_type", pattern: /subagent_type/u },
  { name: "knowledge graph", pattern: /\bknowledge graph\b/iu },
  { name: "JUnit", pattern: /\bJUnit\b/iu },
  { name: "Jersey", pattern: /\bJersey\b/u },
  { name: "Guice", pattern: /\bGuice\b/u },
  { name: "Playwright", pattern: /\bPlaywright\b/iu },
  { name: "rtk", pattern: /\brtk\b/u }
];
