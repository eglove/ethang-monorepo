import isNil from "lodash/isNil.js";

export const isMatch = (s: string, p: string): boolean => {
  const isMatchFound = (index1: number, index2: number): boolean => {
    if (index2 === p.length) {
      return index1 === s.length;
    }

    const isCharacterMatchesOrPeriod =
      index1 < s.length && (s[index1] === p[index2] || "." === p[index2]);

    if (index2 + 1 < p.length && "*" === p[index2 + 1]) {
      const isZeroOccurrences = isMatchFound(index1, index2 + 2);
      const isOneOrMoreOccurrences =
        isCharacterMatchesOrPeriod && isMatchFound(index1 + 1, index2);

      return isZeroOccurrences || isOneOrMoreOccurrences;
    }

    return isCharacterMatchesOrPeriod && isMatchFound(index1 + 1, index2 + 1);
  };

  return isMatchFound(0, 0);
};

const isCharacterMatch = (
  charS: string | undefined,
  charP: string | undefined
) => {
  return charS !== undefined && (charS === charP || "." === charP);
};

const handleRepeatingPattern = (
  stack: [number, number][],
  stringIndex: number,
  patternIndex: number,
  isCharacterMatches: boolean
) => {
  stack.push([stringIndex, patternIndex + 2]);
  if (isCharacterMatches) {
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

    const isNextCharIsStar =
      patternIndex + 1 < p.length && "*" === p[patternIndex + 1];
    const isCharacterMatches = isCharacterMatch(
      s[stringIndex],
      p[patternIndex]
    );

    if (isNextCharIsStar) {
      handleRepeatingPattern(
        stack,
        stringIndex,
        patternIndex,
        isCharacterMatches
      );
      // eslint-disable-next-line sonar/elseif-without-else
    } else if (isCharacterMatches) {
      stack.push([stringIndex + 1, patternIndex + 1]);
    }
  }

  return false;
};
