import isNil from "lodash/isNil.js";

export const isBrowser = !isNil(globalThis.document);
