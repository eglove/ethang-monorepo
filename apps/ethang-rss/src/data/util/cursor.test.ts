/* eslint-disable unicorn/prefer-uint8array-base64, unicorn/no-this-outside-of-class */
import { Effect, Encoding, pipe } from "effect";
import isNil from "lodash/isNil.js";
import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";

import { decodeCursor, encodeCursor } from "./cursor.ts";

describe("cursor utilities", () => {
  it("should encode and decode a valid cursor", async () => {
    const original = ["2026-06-15T10:00:00.000Z", "item-1"] as [string, string];
    const encoded = encodeCursor(original);
    const decoded = await Effect.runPromise(decodeCursor(encoded));

    expect(decoded).toEqual(original);
  });

  it("should encode and decode a cursor with null first value", async () => {
    const original = [null, "item-1"] as [null, string];
    const encoded = encodeCursor(original);
    const decoded = await Effect.runPromise(decodeCursor(encoded));

    expect(decoded).toEqual(original);
  });

  it.each([
    { input: "invalid-base64-string!!" },
    { input: Encoding.encodeBase64("invalid-json") },
    { input: Encoding.encodeBase64("[]") },
    { input: Encoding.encodeBase64("[1]") },
    { input: Encoding.encodeBase64("[1, 2, 3]") },
    { input: Encoding.encodeBase64('["val1", 2]') },
    { input: Encoding.encodeBase64('[2, "val2"]') }
  ])(
    "should return null for invalid cursor structure: $input",
    async ({ input }) => {
      const decoded = await Effect.runPromise(decodeCursor(input));
      expect(decoded).toBeNull();
    }
  );

  describe("native environment paths", () => {
    it("should cover toBase64 and fromBase64 native paths when they exist", async () => {
      /* eslint-disable no-extend-native */
      const originalToBase64 = (Uint8Array.prototype as any).toBase64;
      const originalFromBase64 = (Uint8Array as any).fromBase64;

      Object.defineProperty(Uint8Array.prototype, "toBase64", {
        configurable: true,
        value() {
          return Encoding.encodeBase64(this);
        },
        writable: true
      });

      Object.defineProperty(Uint8Array, "fromBase64", {
        configurable: true,
        value: (base64: string) => {
          return new Uint8Array(Buffer.from(base64, "base64"));
        },
        writable: true
      });

      const runTest = Effect.sync(() => {
        const original = ["2026-06-15T10:00:00.000Z", "item-1"] as [
          string,
          string
        ];
        const encoded = encodeCursor(original);
        return { encoded, original };
      }).pipe(
        // Flatten the decodeCursor Effect directly into the pipeline instead of running it internally
        Effect.flatMap(({ encoded, original }) => {
          return pipe(
            decodeCursor(encoded),
            Effect.map((decoded) => {
              expect(decoded).toEqual(original);
              return decoded;
            })
          );
        })
      );

      const cleanupPrototypes = Effect.sync(() => {
        if (isNil(originalToBase64)) {
          delete (Uint8Array.prototype as any).toBase64;
        } else {
          (Uint8Array.prototype as any).toBase64 = originalToBase64;
        }

        if (isNil(originalFromBase64)) {
          delete (Uint8Array as any).fromBase64;
        } else {
          (Uint8Array as any).fromBase64 = originalFromBase64;
        }
      });

      const testWorkflow = pipe(runTest, Effect.ensuring(cleanupPrototypes));

      await Effect.runPromise(testWorkflow);
    });

    it("should cover fromBase64 throwing error on invalid input", async () => {
      const originalFromBase64 = (Uint8Array as any).fromBase64;
      Object.defineProperty(Uint8Array, "fromBase64", {
        configurable: true,
        value: () => {
          Effect.runSync(Effect.die(new Error("Invalid base64")));
        },
        writable: true
      });

      const runTest = pipe(
        decodeCursor("invalid!!"),
        Effect.map((decoded) => {
          expect(decoded).toBeNull();
          return decoded;
        })
      );

      const cleanupPrototypes = Effect.sync(() => {
        if (isNil(originalFromBase64)) {
          delete (Uint8Array as any).fromBase64;
        } else {
          (Uint8Array as any).fromBase64 = originalFromBase64;
        }
      });

      const testWorkflow = pipe(runTest, Effect.ensuring(cleanupPrototypes));
      await Effect.runPromise(testWorkflow);
    });
  });
});
