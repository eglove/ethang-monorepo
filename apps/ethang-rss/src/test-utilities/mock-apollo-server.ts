/** Test utility that stands in for `@apollo/server` `ApolloServer` in tests. */
export class MockApolloServer {
  public schema: unknown;

  public constructor(config?: { schema: unknown }) {
    this.schema = config?.schema;
  }
}
