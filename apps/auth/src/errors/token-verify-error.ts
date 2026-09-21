export class TokenVerifyError extends Error {
  public readonly _tag = "TokenVerifyError" as const;

  public constructor(
    public override readonly message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "TokenVerifyError";
  }
}
