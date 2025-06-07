import isNil from "lodash/isNil.js";

export const isMatch = (s: string, p: string): boolean => {
  const match = (index1: number, index2: number): boolean => {
    if (index2 === p.length) {
      return index1 === s.length;
    }

    const characterMatchesOrPeriod =
      index1 < s.length && (s[index1] === p[index2] || "." === p[index2]);

    if (index2 + 1 < p.length && "*" === p[index2 + 1]) {
      const zeroOccurrences = match(index1, index2 + 2);
      const oneOrMoreOccurrences =
        characterMatchesOrPeriod && match(index1 + 1, index2);

      return zeroOccurrences || oneOrMoreOccurrences;
    }

    return characterMatchesOrPeriod && match(index1 + 1, index2 + 1);
  };

  return match(0, 0);
};

const isCharacterMatch = (
  charS: string | undefined,
  charP: string | undefined,
) => {
  return charS !== undefined && (charS === charP || "." === charP);
};

const handleRepeatingPattern = (
  stack: [number, number][],
  stringIndex: number,
  patternIndex: number,
  characterMatches: boolean,
) => {
  stack.push([stringIndex, patternIndex + 2]);
  if (characterMatches) {
    stack.push([stringIndex + 1, patternIndex]);
  }
};

export const isMatchNoRecursion = (s: string, p: string): boolean => {
  const stack: [number, number][] = [[0, 0]];

  // eslint-disable-next-line sonar/too-many-break-or-continue-in-loop
  while (0 < stack.length) {
    const current = stack.pop();

    if (isNil(current)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const [stringIndex, patternIndex] = current;

    if (patternIndex === p.length) {
      if (stringIndex === s.length) {
        return true;
      }
      // eslint-disable-next-line no-continue
      continue;
    }

    const nextCharIsStar =
      patternIndex + 1 < p.length && "*" === p[patternIndex + 1];
    const characterMatches = isCharacterMatch(s[stringIndex], p[patternIndex]);

    if (nextCharIsStar) {
      handleRepeatingPattern(
        stack,
        stringIndex,
        patternIndex,
        characterMatches,
      );
      // eslint-disable-next-line sonar/elseif-without-else
    } else if (characterMatches) {
      stack.push([stringIndex + 1, patternIndex + 1]);
    }
  }

  return false;
};
