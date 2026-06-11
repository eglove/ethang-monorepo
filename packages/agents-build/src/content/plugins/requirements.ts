import { definePlugin } from "../../define.ts";
import { esSkill } from "../skills/cli/es.ts";
import { jqSkill } from "../skills/cli/jq.ts";
import { rgSkill } from "../skills/cli/rg.ts";
import { dddStrategicSkill } from "../skills/ddd/strategic.ts";
import { requirementsPipeline } from "../skills/requirements/pipeline.ts";
import { requirementsAnalystRole } from "../skills/roles/requirements-analyst.ts";
import { requirementsWriterRole } from "../skills/roles/requirements-writer.ts";
import { swebokSkill } from "../skills/swebok/index.ts";

export const requirementsPlugin = definePlugin({
  name: "requirements",
  skills: [
    requirementsPipeline,
    requirementsAnalystRole,
    requirementsWriterRole,
    dddStrategicSkill,
    esSkill,
    jqSkill,
    rgSkill,
    swebokSkill([
      "requirements-pipeline",
      "requirements-analyst",
      "requirements-writer",
      "ddd-strategic"
    ])
  ]
});
