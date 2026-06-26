export class InvalidCredentialsError extends Error {
  public readonly _tag = "InvalidCredentialsError" as const;

  public constructor(public override readonly message: string) {
    super(message);
    this.name = "InvalidCredentialsError";
  }
}
