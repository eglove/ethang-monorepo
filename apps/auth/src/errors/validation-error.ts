export class ValidationError extends Error {
  public readonly _tag = "ValidationError" as const;

  public constructor(
    public override readonly message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ValidationError";
  }
}
