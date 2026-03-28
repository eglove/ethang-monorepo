import { describe, expect, it } from "vitest";

import { GlobalStore } from "../stores/global-store-properties.ts";
import { registerScript } from "./register-script.ts";

const NAV_SCRIPT_ID = "components/navigation/navigation";
const CODE_SCRIPT_ID = "components/code";

describe(registerScript, () => {
  it("adds a single script id to globalStore.scripts", () => {
    const store = new GlobalStore();
    store.scripts = new Set();

    registerScript(store, NAV_SCRIPT_ID as never);

    expect(store.scripts.has(NAV_SCRIPT_ID)).toBe(true);
  });

  it("adds multiple script ids in one call", () => {
    const store = new GlobalStore();
    store.scripts = new Set();

    registerScript(store, NAV_SCRIPT_ID as never, CODE_SCRIPT_ID as never);

    expect(store.scripts.has(NAV_SCRIPT_ID)).toBe(true);
    expect(store.scripts.has(CODE_SCRIPT_ID)).toBe(true);
  });

  it("deduplicates — adding the same id twice results in one entry", () => {
    const store = new GlobalStore();
    store.scripts = new Set();

    registerScript(store, NAV_SCRIPT_ID as never);
    registerScript(store, NAV_SCRIPT_ID as never);

    expect(store.scripts.size).toBe(1);
  });
});
