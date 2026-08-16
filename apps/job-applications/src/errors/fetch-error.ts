export class FetchError {
  public readonly _tag = "FetchError" as const;

  public constructor(public readonly message: string) {}
}
