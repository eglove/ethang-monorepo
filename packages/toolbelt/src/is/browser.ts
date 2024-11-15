import isNil from "lodash/isNil.js";

export const isBrowser = "undefined" !== typeof globalThis && !isNil(globalThis.document);
