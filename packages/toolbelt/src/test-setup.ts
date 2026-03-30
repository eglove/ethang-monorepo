// Node 24 ships with a minimal `navigator` global, but tests that target
// browser-specific behavior rely on `typeof navigator === "undefined"` when
// navigator has not been explicitly configured (e.g. via vi.stubGlobal).
// Deleting the property here restores pre-Node-24 behavior so that
// vi.stubGlobal / vi.unstubAllGlobals correctly controls its presence.
// cspell:ignore unstub
Reflect.deleteProperty(globalThis, "navigator");
