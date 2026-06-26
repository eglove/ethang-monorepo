export class TokenVerifyError extends Error {
  public readonly _tag = "TokenVerifyError" as const;

  public constructor(public override readonly message: string) {
    super(message);
    this.name = "TokenVerifyError";
  }
}
