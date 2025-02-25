import every from "lodash/every.js";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map.js";

export type ComputeFunction<T, R> = (source: T) => R;

export type DependencyPaths<T> = Path<T>[];
type Path<T> = Parameters<typeof get<T>>[1];

export class Derived<T extends object, R> {
  private readonly _computeFunction: ComputeFunction<T, R>;
  private readonly _dependencyPaths: DependencyPaths<T>;
  private _lastDependencyValues: unknown[];
  private _lastValue: R | undefined;

  public constructor(
    computeFunction: ComputeFunction<T, R>,
    ...dependencyPaths: DependencyPaths<T>
  ) {
    this._computeFunction = computeFunction;
    this._dependencyPaths = dependencyPaths;
    this._lastDependencyValues = [];
  }

  public compute(source: T) {
    const currentDependencyValues = map(this._dependencyPaths, (path) => {
      return get(source, path) as unknown;
    });

    const hasChanged = isEmpty(this._lastDependencyValues)
      ? false
      : !every(this._lastDependencyValues, (value, index) => {
          return Object.is(value, currentDependencyValues[index]);
        });

    if (hasChanged || this._lastValue === undefined) {
      this._lastValue = this._computeFunction(source);
      this._lastDependencyValues = currentDependencyValues;
    }

    return this._lastValue;
  }

  public reset() {
    this._lastValue = undefined;
    this._lastDependencyValues = [];
  }
}
