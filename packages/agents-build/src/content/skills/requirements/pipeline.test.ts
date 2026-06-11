import { describe, expect, it } from "vitest";

import { requirementsPipeline } from "./pipeline.ts";

describe("requirementsPipeline content", () => {
  it("interviews for intake using /grill-me and the git-style option list", () => {
    expect(requirementsPipeline.content).toContain(
      "## Step 1: Task Intake (Interview via /grill-me)"
    );
    expect(requirementsPipeline.content).toContain(
      "Interview the user about every aspect of their requirements/task using the `/grill-me` command workflow"
    );
    expect(requirementsPipeline.content).toContain(
      'Ask: "Does this look right?" — Confirm / Correct / Cancel. Wait for the answer.'
    );
  });

  it("references the linked issues discovered in Step 1 in Step 2", () => {
    expect(requirementsPipeline.content).toContain(
      "For each linked issue (discovered in Step 1), fetch and summarize."
    );
  });

  it("approves the final requirements definition using the git-style option list", () => {
    expect(requirementsPipeline.content).toContain(
      'Ask: "Approve as final?" — Approve / Request changes / Cancel. Wait for the answer.'
    );
  });
});
