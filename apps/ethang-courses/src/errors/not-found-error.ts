export class NotFoundError {
  public readonly _tag = "NotFoundError" as const;

  public constructor(public readonly message: string) {}
}
