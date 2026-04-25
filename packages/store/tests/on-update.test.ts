// eslint-disable-next-line max-classes-per-file
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

class DestroyingStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
  }

  // eslint-disable-next-line sonar/no-identical-functions
  public increment() {
    this.update((draft) => {
      draft.count += 1;
    });
  }

  protected override onPropertyChange() {
    this.destroy();
  }
}

const store = new ConcreteStore();
const destroyingStore = new DestroyingStore();

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

  it("should not fire patches after destroy", () => {
    const onPropertyChangeSpy = vi.spyOn(
      destroyingStore,
      // @ts-expect-error for test
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      "onPropertyChange" as keyof BaseStore<object>,
    );
    destroyingStore.increment();
    expect(onPropertyChangeSpy).toHaveBeenCalledTimes(1);
  });
});
