import { updateReadme } from "./src/build/update-readme.js";
import { updateRules } from "./src/build/update-rules.js";

await updateRules();
updateReadme();
