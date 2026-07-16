import { Data } from "effect";

export class UnauthorizedError extends Data.Error<{
  readonly message: string;
}> {
  public override readonly name = "UnauthorizedError";
}
