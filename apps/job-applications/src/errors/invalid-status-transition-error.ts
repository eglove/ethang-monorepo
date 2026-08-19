export class InvalidStatusTransitionError {
  public readonly _tag = "InvalidStatusTransitionError" as const;

  public constructor(public readonly message: string) {}
}
