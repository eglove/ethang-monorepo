export class ValidationError {
  public readonly _tag = "ValidationError" as const;

  public constructor(public readonly message: string) {}
}
