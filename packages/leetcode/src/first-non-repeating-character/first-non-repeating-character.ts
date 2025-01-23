import split from "lodash/split.js";

export const firstNonRepeatingCharacter = (
  string: string,
) => {
  const found = new Map<string, {
    count: number;
    index: number;
  }>([]);

  for (const [index, character] of split(string, "").entries()) {
    if (found.has(character)) {
      found.set(character, {
      // @ts-expect-error checked above
        count: found.get(character).count + 1,
        index,
      });
    } else {
      found.set(character, {
        count: 1,
        index,
      });
    }
  }

  for (const [, value] of found) {
    if (1 === value.count) {
      return value.index;
    }
  }

  return -1;
};
