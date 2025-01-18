export const runLengthEncoding = (
  string: string,
) => {
  const encodedStringCharacters: string[] = [];
  let currentRunLength = 1;

  for (let index = 1; index < string.length; index += 1) {
    const currentCharacter = string.charAt(index);
    const previousCharacter = string.charAt(index - 1);

    if (currentCharacter !== previousCharacter || 9 === currentRunLength) {
      encodedStringCharacters.push(String(currentRunLength), previousCharacter);
      currentRunLength = 0;
    }

    currentRunLength += 1;
  }

  encodedStringCharacters.push(String(currentRunLength), String(string.at(-1)));

  return encodedStringCharacters.join("");
};
