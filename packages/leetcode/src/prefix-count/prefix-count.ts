import startsWith from "lodash/startsWith";

export const prefixCount = (
  words: string[],
  pref: string,
): number => {
  let count = 0;

  for (const word of words) {
    if (startsWith(word, pref)) {
      count += 1;
    }
  }

  return count;
};
