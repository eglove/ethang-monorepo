export class FetchError extends Error {
  public readonly _tag = "FetchError" as const;

  public constructor(public override readonly message: string) {
    super(message);
    this.name = "FetchError";
  }
}
