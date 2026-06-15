import isArray from "lodash/isArray.js";
import isFunction from "lodash/isFunction.js";
import isString from "lodash/isString.js";
import { Buffer } from "node:buffer";

type Uint8ArrayConstructorWithBase64 = {
  fromBase64?: (base64: string) => Uint8Array;
} & typeof Uint8Array;

type Uint8ArrayWithBase64 = {
  toBase64?: () => string;
} & Uint8Array;

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

const safeDecode = (cursor: string) => {
  const bytes = decodeBase64ToBytes(cursor);
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
};

export const decodeCursor = (cursor: string) => {
  let json = "";
  try {
    json = safeDecode(cursor);
  } catch {
    return null;
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(json);
  } catch {
    return null;
  }

  if (isArray(decoded) && 2 === decoded.length) {
    const array: unknown[] = decoded;
    const [firstValue, secondValue] = array;
    if (
      (isString(firstValue) || null === firstValue) &&
      isString(secondValue)
    ) {
      return [firstValue, secondValue] as [null | string, string];
    }
  }
  return null;
};
