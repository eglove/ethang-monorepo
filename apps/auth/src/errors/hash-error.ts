export class HashError extends Error {
  public readonly _tag = "HashError" as const;

  public constructor(public override readonly message: string) {
    super(message);
    this.name = "HashError";
  }
}
