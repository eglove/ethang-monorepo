export class NotFoundError extends Error {
  public readonly _tag = "NotFoundError" as const;

  public constructor(
    public override readonly message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "NotFoundError";
  }
}
