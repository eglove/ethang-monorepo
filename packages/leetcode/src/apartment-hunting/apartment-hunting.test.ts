import { describe, expect, it } from "vitest";

import { apartmentHunting } from "./apartment-hunting.js";

describe(
  "apartmentHunting", () => {
    it(
      "should work", () => {
        expect(apartmentHunting(
          [
            {
              gym: false,
              school: true,
              store: false,
            },
            {
              gym: true,
              school: false,
              store: false,
            },
            {
              gym: true,
              school: true,
              store: false,
            },
            {
              gym: false,
              school: true,
              store: false,
            },
            {
              gym: false,
              school: true,
              store: true,
            },
          ], ["gym", "school", "store"],
        )).toBe(3);
      },
    );
  },
);
