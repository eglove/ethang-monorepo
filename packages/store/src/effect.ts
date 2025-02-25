import { type DependencyPaths, Derived } from "./derived.js";

export class Effect<T extends object> {
  private readonly _derived: Derived<T, unknown>;

  public constructor(
    effectFunction: (state: T) => void,
    ...dependencyPaths: DependencyPaths<T>
  ) {
    this._derived = new Derived(effectFunction, ...dependencyPaths);
  }

  public execute(source: T) {
    this._derived.compute(source);
  }

  public reset() {
    this._derived.reset();
  }
}
