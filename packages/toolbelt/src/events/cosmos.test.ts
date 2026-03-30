// @vitest-environment happy-dom

import every from "lodash/every.js";
import noop from "lodash/noop.js";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Cosmos } from "./cosmos.ts";

describe(Cosmos, () => {
  let cosmos: Cosmos;
  let targetA: EventTarget;
  let targetB: EventTarget;

  beforeAll(() => {
    cosmos = new Cosmos();
    targetA = document.createElement("div");
    targetB = document.createElement("div");
  });

  describe("getEventListeners with filters", () => {
    it("returns all listeners when no filters provided", () => {
      const listener = vi.fn<() => void>();
      cosmos.addEventListener(targetA, "click", listener);
      const results = cosmos.getEventListeners();

      expect(results.length).toBeGreaterThan(0);
    });

    it("priority 1 — matches by id", () => {
      const listener = vi.fn<() => void>();
      const id = cosmos.addEventListener(targetA, "click", listener);
      const results = cosmos.getEventListeners({ id });

      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe(id);
    });

    it("priority 2 — matches by listener + eventName without options", () => {
      const listener = vi.fn<() => void>();
      cosmos.addEventListener(targetA, "focus", listener);
      const results = cosmos.getEventListeners({
        eventName: "focus",
        listener,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(every(results, (r) => r.listener === listener)).toBe(true);
    });

    it("priority 3 — matches by listener + eventName + options", () => {
      const listener = vi.fn<() => void>();
      const options = { capture: true };
      cosmos.addEventListener(targetA, "blur", listener, options);
      const results = cosmos.getEventListeners({
        eventName: "blur",
        listener,
        options,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("priority 4 — matches by eventName + target", () => {
      const listener = vi.fn<() => void>();
      cosmos.addEventListener(targetB, "keydown", listener);
      const results = cosmos.getEventListeners({
        eventName: "keydown",
        eventTarget: targetB,
      });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(every(results, (r) => r.eventTarget === targetB)).toBe(true);
    });

    it("priority 5 — matches by eventName alone", () => {
      const listener = vi.fn<() => void>();
      cosmos.addEventListener(targetA, "mouseenter", listener);
      const results = cosmos.getEventListeners({ eventName: "mouseenter" });

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it("priority 5 — matches by target alone", () => {
      const dedicated = document.createElement("span");
      const listener = vi.fn<() => void>();
      cosmos.addEventListener(dedicated, "click", listener);
      const results = cosmos.getEventListeners({ eventTarget: dedicated });

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(every(results, (r) => r.eventTarget === dedicated)).toBe(true);
    });

    it("priority 6 — empty filters return all listeners", () => {
      const all = cosmos.getEventListeners({});

      expect(all.length).toBe(cosmos.eventListenersSize);
    });
  });

  describe("removeEventListeners", () => {
    it("removes a listener by id", () => {
      const listener = vi.fn<() => void>();
      const id = cosmos.addEventListener(targetA, "click", listener);
      const sizeBefore = cosmos.eventListenersSize;
      cosmos.removeEventListeners({ id });

      expect(cosmos.eventListenersSize).toBe(sizeBefore - 1);
    });
  });

  describe("removeEventListener (direct)", () => {
    it("returns false for a non-existent id", () => {
      const result = cosmos.removeEventListener("non-existent-id");

      expect(result).toBe(false);
    });

    it("returns true and decrements size when id exists", () => {
      const listener = vi.fn<() => void>();
      const id = cosmos.addEventListener(targetA, "dblclick", listener);
      const sizeBefore = cosmos.eventListenersSize;

      const result = cosmos.removeEventListener(id);

      expect(result).toBe(true);
      expect(cosmos.eventListenersSize).toBe(sizeBefore - 1);
    });
  });

  describe("debug mode", () => {
    it("logs on addEventListener and removeEventListener when debug is true", () => {
      const debugCosmos = new Cosmos({ debug: true });
      const consoleSpy = vi
        .spyOn(globalThis.console, "log")
        .mockImplementation(noop);
      const warnSpy = vi
        .spyOn(globalThis.console, "warn")
        .mockImplementation(noop);
      const element = document.createElement("div");
      const listener = vi.fn<() => void>();

      const id = debugCosmos.addEventListener(element, "click", listener);
      expect(consoleSpy).toHaveBeenCalledWith("Added event listener", id);

      debugCosmos.removeEventListener(id);
      expect(consoleSpy).toHaveBeenCalledWith("Removed event listener", id);

      debugCosmos.removeEventListener("ghost-id");
      expect(warnSpy).toHaveBeenCalledWith(
        "No event listener found for id",
        "ghost-id",
      );

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });
});
