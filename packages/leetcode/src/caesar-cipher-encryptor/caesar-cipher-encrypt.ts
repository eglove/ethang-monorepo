import split from "lodash/split.js";

const alphabet = split("abcdefghijklmnopqrstuvwxyz", "");

export const caesarCipherEncrypt = (string: string, key: number) => {
  const result: string[] = [];

  for (const character of string) {
    const characterIndex = alphabet.indexOf(character) + key;

    result.push(
      String(
        characterIndex >= alphabet.length
          ? alphabet[characterIndex % alphabet.length]
          : alphabet[characterIndex]
      )
    );
  }

  return result.join("");
};
