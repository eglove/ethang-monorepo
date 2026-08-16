export class ResumeError {
  public readonly _tag = "ResumeError" as const;

  public constructor(public readonly message: string) {}
}
