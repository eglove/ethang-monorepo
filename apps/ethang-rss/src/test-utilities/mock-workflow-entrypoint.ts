export class MockWorkflowEntrypoint {
  public ctx: unknown;
  public env: unknown;

  public constructor(context: unknown, environment: unknown) {
    this.ctx = context;
    this.env = environment;
  }
}
