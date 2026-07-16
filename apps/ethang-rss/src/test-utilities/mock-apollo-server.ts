/** Test utility that stands in for `@apollo/server` `ApolloServer` in tests. */
export class MockApolloServer {
  public schema: unknown;

  public constructor(config?: { schema: unknown }) {
    // v8 ignore next -- defensive guard: callers always pass a schema in tests
    this.schema = config?.schema;
  }
}
