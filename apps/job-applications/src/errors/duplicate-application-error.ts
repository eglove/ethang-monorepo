// eslint-disable-next-line unicorn/name-replacements -- part of domain contract used in Task 11 RpcResult mapping
export class DuplicateApplicationError {
  public readonly _tag = "DuplicateApplicationError" as const;

  public constructor(public readonly message: string) {}
}
