export class SaveError {
  public readonly _tag = "SaveError" as const;

  public constructor(public readonly message: string) {}
}
