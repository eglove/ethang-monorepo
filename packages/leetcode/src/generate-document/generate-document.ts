import join from "lodash/join.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";

export const generateDocument = (
  characters: string,
  document: string,
) => {
  const charactersSorted = join(split(characters, "")
    .sort((a, b) => {
      return a.localeCompare(b);
    }), "");

  const documentSorted = join(split(document, "")
    .sort((a, b) => {
      return a.localeCompare(b);
    }), "");

  return startsWith(charactersSorted, documentSorted) ||
    startsWith(documentSorted, charactersSorted);
};

export const generateDocumentMap = (
  characters: string,
  document: string,
) => {
  const characterCounts = new Map<string, number>();

  for (const character of characters) {
    if (!characterCounts.has(character)) {
      characterCounts.set(character, 0);
    }

    // @ts-expect-error set above
    characterCounts.set(character, characterCounts.get(character) + 1);
  }

  for (const character of document) {
    if (
      !characterCounts.has(character) ||
      0 === characterCounts.get(character)
    ) {
      return false;
    }

    // @ts-expect-error checked above
    characterCounts.set(character, characterCounts.get(character) - 1);
  }

  return true;
};
