import { describe, expect, it } from "vitest";

import { buildScriptManifest } from "./build-script-manifest.ts";

const CODE_ID = "components/code";
const SIGN_IN_ID = "components/routes/sign-in";

describe(buildScriptManifest, () => {
  it("maps a single script id to its stable client URL", () => {
    expect(buildScriptManifest([CODE_ID])).toStrictEqual({
      [CODE_ID]: "/scripts/components/code.client.js",
    });
  });

  it("maps multiple script ids to their stable client URLs", () => {
    expect(buildScriptManifest([CODE_ID, SIGN_IN_ID])).toStrictEqual({
      [CODE_ID]: "/scripts/components/code.client.js",
      [SIGN_IN_ID]: "/scripts/components/routes/sign-in.client.js",
    });
  });

  it("returns an empty object when given no ids", () => {
    expect(buildScriptManifest([])).toStrictEqual({});
  });
});
