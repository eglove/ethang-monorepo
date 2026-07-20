import { describe, expect, it } from "vitest";

import { findCall } from "./.fixture.ts";
import {
  detectDecodeBase64Pattern,
  detectEncodeBase64Pattern,
  detectEncodingBase64Pattern
} from "./prefer-effect-encoding-base64.ts";

const encodeSamples = [
  'Buffer.from(s).toString("base64")',
  'Buffer.from(name + "!").toString("base64")',
  'Buffer.from(getRaw()).toString("base64")'
];

const decodeSamples = [
  'Buffer.from(s, "base64").toString()',
  'Buffer.from(s, "base64").toString("utf8")'
];

const encodeNegatives = [
  { code: 'Buffer.from(s).toString("hex")', label: "a non-base64 toString" },
  {
    code: "Buffer.from(s).toString()",
    label: "Buffer.from with no toString arg"
  },
  {
    code: 'foo.toString("base64")',
    label: "toString on a non-Buffer receiver"
  },
  {
    code: 'new Buffer(s).toString("base64")',
    label: "new Buffer (not Buffer.from)"
  },
  {
    code: 'Buffer.from(s, "utf8").toString("base64")',
    label: "Buffer.from with two args (not a plain encode)"
  }
];

const decodeNegatives = [
  {
    code: 'Buffer.from(s, "utf8").toString()',
    label: "the inner encoding arg is not base64"
  },
  {
    code: 'Buffer.from(s, "base64").toString("hex")',
    label: "toString receives a non-utf8 encoding arg"
  },
  {
    code: 'Buffer.from(s).toString("base64")',
    label: "a bare Buffer.from encode call"
  }
];

describe("prefer-effect-encoding-base64", () => {
  describe("detectEncodeBase64Pattern", () => {
    it.each(encodeSamples)("detects encode shape %s", (code) => {
      const { call } = findCall(code);
      const result = detectEncodeBase64Pattern(call);
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("encode");
    });

    it.each(encodeNegatives)("returns null for $label", ({ code }) => {
      const { call } = findCall(code);
      expect(detectEncodeBase64Pattern(call)).toBeNull();
    });
  });

  describe("detectDecodeBase64Pattern", () => {
    it.each(decodeSamples)("detects decode shape %s", (code) => {
      const { call } = findCall(code);
      const result = detectDecodeBase64Pattern(call);
      expect(result).not.toBeNull();
      expect(result?.kind).toBe("decode");
    });

    it.each(decodeNegatives)("returns null when $label", ({ code }) => {
      const { call } = findCall(code);
      expect(detectDecodeBase64Pattern(call)).toBeNull();
    });
  });

  describe("detectEncodingBase64Pattern (combined)", () => {
    it.each(encodeSamples)("classifies encode %s", (code) => {
      const { call } = findCall(code);
      expect(detectEncodingBase64Pattern(call)?.kind).toBe("encode");
    });

    it.each(decodeSamples)("classifies decode %s", (code) => {
      const { call } = findCall(code);
      expect(detectEncodingBase64Pattern(call)?.kind).toBe("decode");
    });

    it("returns null for an unrelated call", () => {
      const { call } = findCall("arr.map((x) => x * 2)");
      expect(detectEncodingBase64Pattern(call)).toBeNull();
    });
  });
});
