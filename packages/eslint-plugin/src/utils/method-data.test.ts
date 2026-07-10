import { describe, expect, it } from "vitest";

import {
  ALL_COMPOSE_METHODS,
  COMPOSE_LEFT_TO_RIGHT,
  COMPOSE_RIGHT_TO_LEFT,
  getMainAlias,
  getMethodMaxArguments,
  isChainableMethod,
  isChainBreakerMethod,
  isMainAlias,
  isWrapperMethod,
  LODASH_V4_ALIAS_TO_MAIN,
  LODASH_V4_ALIASES
} from "./method-data.ts";

describe("method-data", () => {
  describe("LODASH_V4_ALIASES", () => {
    it("contains 8 main methods with aliases", () => {
      expect(LODASH_V4_ALIASES.size).toBe(8);
    });
  });

  describe("LODASH_V4_ALIAS_TO_MAIN", () => {
    it("maps each alias to its main method", () => {
      expect(LODASH_V4_ALIAS_TO_MAIN.get("each")).toBe("forEach");
      expect(LODASH_V4_ALIAS_TO_MAIN.get("extend")).toBe("assignIn");
      expect(LODASH_V4_ALIAS_TO_MAIN.get("first")).toBe("head");
      expect(LODASH_V4_ALIAS_TO_MAIN.get("entries")).toBe("toPairs");
    });
  });

  describe("getMainAlias", () => {
    it("returns the main method for an alias", () => {
      expect(getMainAlias("each")).toBe("forEach");
      expect(getMainAlias("extend")).toBe("assignIn");
    });

    it("returns the method itself if it is not an alias", () => {
      expect(getMainAlias("forEach")).toBe("forEach");
      expect(getMainAlias("map")).toBe("map");
      expect(getMainAlias("unknownMethod")).toBe("unknownMethod");
    });
  });

  describe("isMainAlias", () => {
    it("returns true for main method names", () => {
      expect(isMainAlias("forEach")).toBe(true);
      expect(isMainAlias("assignIn")).toBe(true);
      expect(isMainAlias("head")).toBe(true);
    });

    it("returns false for aliases and unknown methods", () => {
      expect(isMainAlias("each")).toBe(false);
      expect(isMainAlias("extend")).toBe(false);
      expect(isMainAlias("map")).toBe(false);
      expect(isMainAlias("unknown")).toBe(false);
    });
  });

  describe("compose sets", () => {
    it("COMPOSE_LEFT_TO_RIGHT contains flow and pipe", () => {
      expect(COMPOSE_LEFT_TO_RIGHT.has("flow")).toBe(true);
      expect(COMPOSE_LEFT_TO_RIGHT.has("pipe")).toBe(true);
      expect(COMPOSE_LEFT_TO_RIGHT.has("flowRight")).toBe(false);
    });

    it("COMPOSE_RIGHT_TO_LEFT contains flowRight and compose", () => {
      expect(COMPOSE_RIGHT_TO_LEFT.has("flowRight")).toBe(true);
      expect(COMPOSE_RIGHT_TO_LEFT.has("compose")).toBe(true);
      expect(COMPOSE_RIGHT_TO_LEFT.has("flow")).toBe(false);
    });

    it("ALL_COMPOSE_METHODS contains all four", () => {
      expect(ALL_COMPOSE_METHODS.size).toBe(4);
      expect(ALL_COMPOSE_METHODS.has("flow")).toBe(true);
      expect(ALL_COMPOSE_METHODS.has("flowRight")).toBe(true);
      expect(ALL_COMPOSE_METHODS.has("pipe")).toBe(true);
      expect(ALL_COMPOSE_METHODS.has("compose")).toBe(true);
    });
  });

  describe("chainable methods", () => {
    it("isChainableMethod returns true for chainable methods", () => {
      expect(isChainableMethod("map")).toBe(true);
      expect(isChainableMethod("filter")).toBe(true);
      expect(isChainableMethod("sortBy")).toBe(true);
    });

    it("isChainableMethod returns false for non-chainable methods", () => {
      expect(isChainableMethod("add")).toBe(false);
      expect(isChainableMethod("clone")).toBe(false);
    });

    it("isChainableMethod returns false for non-chainable aliases", () => {
      expect(isChainableMethod("each")).toBe(false);
    });
  });

  describe("chain breaker methods", () => {
    it("isChainBreakerMethod returns true for chain breakers", () => {
      expect(isChainBreakerMethod("value")).toBe(true);
      expect(isChainBreakerMethod("toJSON")).toBe(true);
      expect(isChainBreakerMethod("valueOf")).toBe(true);
    });

    it("isChainBreakerMethod returns false for non-breakers", () => {
      expect(isChainBreakerMethod("map")).toBe(false);
      expect(isChainBreakerMethod("filter")).toBe(false);
    });
  });

  describe("wrapper methods", () => {
    it("isWrapperMethod returns true for wrapper methods", () => {
      expect(isWrapperMethod("concat")).toBe(true);
      expect(isWrapperMethod("join")).toBe(true);
      expect(isWrapperMethod("push")).toBe(true);
      expect(isWrapperMethod("value")).toBe(true);
    });

    it("isWrapperMethod returns false for non-wrapper methods", () => {
      expect(isWrapperMethod("map")).toBe(false);
      expect(isWrapperMethod("filter")).toBe(false);
    });
  });

  describe("getMethodMaxArguments", () => {
    it("returns correct max args for known methods", () => {
      expect(getMethodMaxArguments("assign")).toBe(2);
      expect(getMethodMaxArguments("clone")).toBe(1);
      expect(getMethodMaxArguments("merge")).toBe(2);
      expect(getMethodMaxArguments("assignInWith")).toBe(4);
    });

    it("returns default 3 for unknown methods", () => {
      expect(getMethodMaxArguments("unknownMethod")).toBe(3);
      expect(getMethodMaxArguments("map")).toBe(3);
    });
  });
});
