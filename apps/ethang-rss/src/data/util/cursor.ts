import { Effect, Option, Schema } from "effect";
import constant from "lodash/constant.js";
import isFunction from "lodash/isFunction.js";
import { Buffer } from "node:buffer";

type Uint8ArrayConstructorWithBase64 = {
  fromBase64?: (base64: string) => Uint8Array;
} & typeof Uint8Array;

type Uint8ArrayWithBase64 = {
  toBase64?: () => string;
} & Uint8Array;

const CursorTupleSchema = Schema.Tuple(
  Schema.NullOr(Schema.String),
  Schema.String
);

export const encodeCursor = (value: [null | string, string]) => {
  const json = JSON.stringify(value);
  const encoder = new TextEncoder();
  const bytes = encoder.encode(json) as Uint8ArrayWithBase64;

  if (isFunction(bytes.toBase64)) {
    return bytes.toBase64();
  }
  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  return Buffer.from(bytes).toString("base64");
};

const decodeBase64ToBytes = (cursor: string) => {
  const ctor = Uint8Array as Uint8ArrayConstructorWithBase64;

  if (isFunction(ctor.fromBase64)) {
    return ctor.fromBase64(cursor);
  }
  // eslint-disable-next-line unicorn/prefer-uint8array-base64
  return new Uint8Array(Buffer.from(cursor, "base64"));
};

const safeDecode = (cursor: string): Effect.Effect<string, unknown> => {
  return Effect.try(() => {
    const bytes = decodeBase64ToBytes(cursor);
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  });
};

export const decodeCursor = (
  cursor: string
): Effect.Effect<[null | string, string] | null> => {
  return Effect.gen(function* () {
    const json = yield* safeDecode(cursor).pipe(
      Effect.orElse(() => {
        return Effect.succeed("");
      })
    );
    if ("" === json) {
      return null;
    }

    const validated = yield* Effect.try({
      catch: constant(Option.none<[null | string, string]>()),
      try: () => {
        return Schema.decodeUnknownOption(CursorTupleSchema)(JSON.parse(json));
      }
    }).pipe(
      Effect.orElse(() => {
        return Effect.succeed(Option.none<[null | string, string]>());
      })
    );

    if (Option.isNone(validated)) {
      return null;
    }
    const [first, second] = validated.value;
    return [first, second] as [null | string, string];
  });
};
