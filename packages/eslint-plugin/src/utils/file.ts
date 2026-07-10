// Helpers for working with the file path / filename portion of an ESLint context. The barrel-file rule keys off the file name and the no-try-catch rule does not; the helpers are kept here to keep the rules themselves small.

import split from "lodash/split.js";

const BARREL_FILENAME = /^index\.(?:c?js|m?js|cts|mts|ts|tsx|js|jsx|d\.ts)$/u;

const splitPath = (filename: string): readonly string[] => {
  return split(filename, /[\\/]/u);
};

export const isBarrelFilename = (filename: string): boolean => {
  const segments = splitPath(filename);
  const basename = segments.at(-1);
  return basename !== undefined && BARREL_FILENAME.test(basename);
};

export const isInsideNodeModules = (filename: string): boolean => {
  return /[\\/]node_modules[\\/]/u.test(filename);
};
