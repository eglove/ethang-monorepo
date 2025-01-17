import flow from "lodash/flow.js";
import join from "lodash/join.js";
import reverse from "lodash/reverse.js";
import split from "lodash/split.js";

export const isPalindrome = (string: string) => {
  const reversed = flow(
    (value: string) => {
      return split(value, "");
    },
    reverse,
    (value) => {
      return join(value, "");
    },
  )(string);

  return string === reversed;
};
