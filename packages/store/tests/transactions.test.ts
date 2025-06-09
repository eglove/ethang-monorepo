import { beforeEach, describe, expect, it, vi } from "vitest";

import { BaseStore } from "../src/index.ts";

type TestState = {
  count: number;
  logs: string[];
};

class TestStore extends BaseStore<TestState> {
  public constructor(initialCount = 0) {
    super({ count: initialCount, logs: [] });
  }

  public clearLogs() {
    this.update((draft) => {
      draft.logs = [];
    });
  }

  public decrement(amount = 1) {
    this.update((draft) => {
      draft.count -= amount;
      draft.logs.push(`Decremented by ${amount}`);
    });
  }

  public increment(amount = 1) {
    this.update((draft) => {
      draft.count += amount;
      draft.logs.push(`Incremented by ${amount}`);
    });
  }

  public setCount(newCount: number) {
    this.update((draft) => {
      draft.count = newCount;
      draft.logs.push(`Set count to ${newCount}`);
    });
  }
}

describe("BaseStore with Transaction Functionality", () => {
  let store: TestStore;
  let subscriber: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    store = new TestStore();
    subscriber = vi.fn();
    store.subscribe(subscriber);
  });

  it("should not be in a transaction initially", () => {
    // @ts-expect-error allow for test
    expect(store._inTransaction).toBe(false);
  });

  it("should start a transaction and set _inTransaction to true", () => {
    store.startTransaction();
    // @ts-expect-error allow for test
    expect(store._inTransaction).toBe(true);
  });

  it("should queue updates during a transaction and not notify subscribers immediately", () => {
    store.startTransaction();
    store.increment(5);
    store.decrement(2);
    store.setCount(10);

    expect(store.state.count).toBe(0);
    expect(store.state.logs).toEqual([]);
    expect(subscriber).not.toHaveBeenCalled();

    // @ts-expect-error allow for test
    expect(store._transactionUpdates.size).toBe(3);
  });

  it("should apply all queued updates and notify subscribers once on commitTransaction", () => {
    store.startTransaction();
    store.increment(5);
    store.decrement(2);
    store.setCount(10);

    store.commitTransaction();

    expect(store.state.count).toBe(10);
    expect(store.state.logs).toEqual([
      "Incremented by 5",
      "Decremented by 2",
      "Set count to 10",
    ]);

    // @ts-expect-error allow for test
    expect(store._inTransaction).toBe(false);
    // @ts-expect-error allow for test
    expect(store._transactionUpdates.size).toBe(0);
  });

  it("should discard all queued updates and leave state unchanged on rollbackTransaction", () => {
    store.setCount(5);
    subscriber.mockClear();

    store.startTransaction();
    store.increment(10);
    store.clearLogs();
    store.decrement(3);

    expect(store.state.count).toBe(5);
    expect(store.state.logs).toEqual(["Set count to 5"]);
    expect(subscriber).not.toHaveBeenCalled();

    store.rollbackTransaction();

    expect(store.state.count).toBe(5);
    expect(store.state.logs).toEqual(["Set count to 5"]);
    expect(subscriber).not.toHaveBeenCalled();

    // @ts-expect-error allow for test
    expect(store._inTransaction).toBe(false);
    // @ts-expect-error allow for test
    expect(store._transactionUpdates.size).toBe(0);
  });

  it("should allow normal updates after a transaction is committed", () => {
    store.startTransaction();
    store.increment(5);
    store.commitTransaction();
    subscriber.mockClear();

    store.decrement(1);

    expect(store.state.count).toBe(4);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith({
      count: 4,
      logs: ["Incremented by 5", "Decremented by 1"],
    });
  });

  it("should allow normal updates after a transaction is rolled back", () => {
    store.startTransaction();
    store.increment(5);
    store.rollbackTransaction();
    subscriber.mockClear();

    store.increment(1);

    expect(store.state.count).toBe(1);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(subscriber).toHaveBeenCalledWith({
      count: 1,
      logs: ["Incremented by 1"],
    });
  });
});
