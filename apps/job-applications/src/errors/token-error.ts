export class TokenError {
  public readonly _tag = "TokenError" as const;

  public constructor(public readonly message: string) {}
}
