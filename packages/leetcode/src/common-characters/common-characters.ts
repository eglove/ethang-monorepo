export const commonCharacters = (strings: string[]) => {
  const characterCounts = new Map<string, number>();

  for (const string of strings) {
    const uniqueStringCharacters = new Set(string);

    for (const character of uniqueStringCharacters) {
      characterCounts.set(character, (characterCounts.get(character) ?? 0) + 1);
    }
  }

  const finalCharacters: string[] = [];
  for (const [character, count] of characterCounts) {
    if (count === strings.length) {
      finalCharacters.push(character);
    }
  }

  return finalCharacters;
};
