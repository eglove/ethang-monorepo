import { describe, expect, it } from "vitest";

import { knightConnection } from "./knight-connection.js";

describe(
  "knightConnection", () => {
    it(
      "should work", () => {
        expect(knightConnection(
          [0, 0], [4, 2],
        ))
          .toStrictEqual(1);
      },
    );
  },
);
