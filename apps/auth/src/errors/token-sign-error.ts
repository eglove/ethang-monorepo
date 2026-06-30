export class TokenSignError extends Error {
  public readonly _tag = "TokenSignError" as const;

  public constructor(public override readonly message: string) {
    super(message);
    this.name = "TokenSignError";
  }
}
