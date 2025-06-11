import { describe, expect, it, vi } from "vitest";

import { BaseStore, type StorePatch } from "../src/index.js";

const initialState = {
  count: 0,
  person: {
    name: {
      firstName: "John",
      lastName: "Doe",
    },
  },
};

const mockFunction = vi.fn();

class ConcreteStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
  }

  public increment() {
    this.update((draft) => {
      draft.count += 1;
    });
  }

  protected override onPropertyChange(patch: StorePatch<typeof initialState>) {
    this.update((draft) => {
      if ("count" === patch.path[0]) {
        draft.count += 1;
        draft.person.name.firstName = "Jane";
        mockFunction();
      }
    }, false);
  }
}

const store = new ConcreteStore();

describe("onUpdate", () => {
  it("should run side effects when count updates", () => {
    expect(store.state.count).toBe(0);
    expect(store.state.person.name.firstName).toBe("John");
    expect(mockFunction).toHaveBeenCalledTimes(0);

    store.increment();

    expect(store.state.count).toBe(2);
    expect(store.state.person.name.firstName).toBe("Jane");
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
});
