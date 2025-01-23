export const commonCharacters = (strings: string[]) => {
  const characterCounts = new Map<string, number>();

  for (const string of strings) {
    const uniqueStringCharacters = new Set(string);

    for (const character of uniqueStringCharacters) {
      if (!characterCounts.has(character)) {
        characterCounts.set(character, 0);
      }

      // @ts-expect-error set above
      characterCounts.set(character, characterCounts.get(character) + 1);
    }
  }

  const finalCharacters: string[] = [];
  for (const [character, count] of characterCounts.entries()) {
    if (count === strings.length) {
      finalCharacters.push(character);
    }
  }

  return finalCharacters;
};
