import { describe, expect, it } from "vitest";

import { replaceObjectArray } from "../../src/collection/replace-object-array.js";

type TestObject = {
  age: number;
  id: number;
  name: string;
};

describe("replaceObjectArray", () => {
  it("replaces properties based on a function predicate", () => {
    const collection: TestObject[] = [
      {
        age: 25,
        id: 1,
        name: "Alice",
      },
      {
        age: 30,
        id: 2,
        name: "Bob",
      },
    ];

    const result = replaceObjectArray(collection, (item) => {
      return 1 === item.id;
    }, { age: 26 });

    expect(result).toEqual([
      {
        age: 26,
        id: 1,
        name: "Alice",
      },
      {
        age: 30,
        id: 2,
        name: "Bob",
      },
    ]);
  });

  it("replaces properties based on a key-value predicate", () => {
    const collection: TestObject[] = [
      {
        age: 25,
        id: 1,
        name: "Alice",
      },
      {
        age: 30,
        id: 2,
        name: "Bob",
      },
    ];

    const result = replaceObjectArray(collection, ["name", "Bob"], { age: 31 });

    expect(result).toEqual([
      {
        age: 25,
        id: 1,
        name: "Alice",
      },
      {
        age: 31,
        id: 2,
        name: "Bob",
      },
    ]);
  });

  it("does not change objects that do not match the predicate", () => {
    const collection: TestObject[] = [
      {
        age: 25,
        id: 1,
        name: "Alice",
      },
      {
        age: 30,
        id: 2,
        name: "Bob",
      },
    ];

    const result = replaceObjectArray(collection, (item) => {
      return 3 === item.id;
    }, { age: 35 });

    expect(result).toEqual([
      {
        age: 25,
        id: 1,
        name: "Alice",
      },
      {
        age: 30,
        id: 2,
        name: "Bob",
      },
    ]);
  });

  it("returns a new array with updated objects", () => {
    const collection: TestObject[] = [
      {
        age: 25,
        id: 1,
        name: "Alice",
      },
      {
        age: 30,
        id: 2,
        name: "Bob",
      },
    ];

    const result = replaceObjectArray(collection, (item) => {
      return 2 === item.id;
    }, { name: "Bobby" });

    expect(result).not.toBe(collection);
    expect(result).toEqual([
      {
        age: 25,
        id: 1,
        name: "Alice",
      },
      {
        age: 30,
        id: 2,
        name: "Bobby",
      },
    ]);
  });

  it("adds new properties if they do not exist", () => {
    const collection: TestObject[] = [
      {
        age: 25,
        id: 1,
        name: "Alice",
      },
      {
        age: 30,
        id: 2,
        name: "Bob",
      },
    ];

    const result = replaceObjectArray(collection, (item) => {
      return 1 === item.id;
    }, { nickname: "Ally" } as Partial<TestObject>);

    expect(result).toEqual([
      {
        age: 25,
        id: 1,
        name: "Alice",
        nickname: "Ally",
      },
      {
        age: 30,
        id: 2,
        name: "Bob",
      },
    ]);
  });
});
