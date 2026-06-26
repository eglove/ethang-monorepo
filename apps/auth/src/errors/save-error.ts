export class SaveError extends Error {
  public readonly _tag = "SaveError" as const;

  public constructor(public override readonly message: string) {
    super(message);
    this.name = "SaveError";
  }
}
