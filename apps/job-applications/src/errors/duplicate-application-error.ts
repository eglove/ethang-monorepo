export class DuplicateApplicationError {
  public readonly _tag = "DuplicateApplicationError" as const;

  public constructor(public readonly message: string) {}
}
