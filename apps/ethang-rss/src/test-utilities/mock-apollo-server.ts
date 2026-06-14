export class MockApolloServer {
  public schema: unknown;

  public constructor(config?: { schema: unknown }) {
    this.schema = config?.schema;
  }
}
