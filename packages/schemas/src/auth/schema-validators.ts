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

// Bounded lengths prevent super-linear backtracking.
const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,64}\.[^\s@]{2,}$/u;

export const emailSchema = Schema.Trim.pipe(
  Schema.pattern(EMAIL_REGEX, { message: constant("Invalid email address") })
);
