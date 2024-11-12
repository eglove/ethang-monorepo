import { updateRules } from "./src/build/update-rules.js";
import { updateReadme } from "./src/build/update-readme.js";

await updateRules();
await updateReadme();
