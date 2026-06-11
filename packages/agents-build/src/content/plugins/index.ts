import type { PluginDefinition } from "../../define.ts";

import { gitPlugin } from "./git.ts";
import { requirementsPlugin } from "./requirements.ts";
import { reviewPlugin } from "./review.ts";
import { tddPlugin } from "./tdd.ts";

/**
 * Explicit array (not Object.entries of namespace imports) so emission order
 * is stable and the generated output stays byte-deterministic.
 */
export const PLUGINS: PluginDefinition[] = [
  gitPlugin,
  requirementsPlugin,
  reviewPlugin,
  tddPlugin
];
