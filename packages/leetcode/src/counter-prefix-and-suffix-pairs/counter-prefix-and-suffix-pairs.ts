import endsWith from "lodash/endsWith.js";
import isNil from "lodash/isNil.js";
import startsWith from "lodash/startsWith.js";

const isPrefixAndSuffix = (string1: string, string2: string) => {
  return startsWith(string2, string1) && endsWith(string2, string1);
};

export const countPrefixSuffixPairs = (words: string[]) => {
  let pointer1 = 0;
  let pointer2 = 1;
  let count = 0;

  while (pointer1 < words.length && pointer2 < words.length + 1) {
    const word1 = words[pointer1];
    const word2 = words[pointer2];

    if (
      !isNil(word1) &&
      !isNil(word2) &&
      pointer1 !== pointer2 &&
      isPrefixAndSuffix(word1, word2)
    ) {
      count += 1;
    }

    if (pointer2 === words.length - 1) {
      pointer1 += 1;
      pointer2 = pointer1 + 1;
    } else {
      pointer2 += 1;
    }
  }

  return count;
};

