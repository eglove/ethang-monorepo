import { definePlugin } from "../../define.ts";
import { esSkill } from "../skills/cli/es.ts";
import { jqSkill } from "../skills/cli/jq.ts";
import { rgSkill } from "../skills/cli/rg.ts";
import { dddStrategicSkill } from "../skills/ddd/strategic.ts";
import { dddTacticalSkill } from "../skills/ddd/tactical.ts";
import { rcaFiveWhysSkill } from "../skills/rca/five-whys.ts";
import { implementerSkill } from "../skills/roles/implementer.ts";
import { plannerSkill } from "../skills/roles/planner.ts";
import { rcaSkill } from "../skills/roles/rca.ts";
import { testWriterSkill } from "../skills/roles/test-writer.ts";
import { swebokSkill } from "../skills/swebok/index.ts";
import { tddPipelineSkill } from "../skills/tdd/pipeline.ts";
import { tddPrinciplesSkill } from "../skills/tdd/principles.ts";
import { tddStateCoverageSkill } from "../skills/tdd/state-coverage.ts";
import { tddTestAsDocumentationSkill } from "../skills/tdd/test-as-documentation.ts";

export const tddPlugin = definePlugin({
  name: "tdd",
  skills: [
    tddPipelineSkill,
    plannerSkill,
    testWriterSkill,
    implementerSkill,
    rcaSkill,
    tddPrinciplesSkill,
    tddStateCoverageSkill,
    tddTestAsDocumentationSkill,
    dddStrategicSkill,
    dddTacticalSkill,
    rcaFiveWhysSkill,
    esSkill,
    jqSkill,
    rgSkill,
    swebokSkill([
      "tdd-pipeline",
      "planner",
      "test-writer",
      "implementer",
      "rca",
      "tdd-principles",
      "tdd-state-coverage",
      "tdd-test-as-documentation",
      "ddd-strategic",
      "ddd-tactical",
      "rca-five-whys"
    ])
  ]
});
