import { Schema } from "effect";
import constant from "lodash/constant.js";

export const passwordSchema = Schema.Trim.pipe(
  // eslint-disable-next-line lodash/prefer-lodash-method
  Schema.filter(
    (s: string) => {
      return 8 <= s.length;
    },
    {
      message: constant("Password must be at least eight characters long")
    }
  )
);

export const emailSchema = Schema.Trim;
