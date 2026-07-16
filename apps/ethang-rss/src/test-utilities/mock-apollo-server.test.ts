import { describe, expect, it } from "vitest";

import { MockApolloServer } from "./mock-apollo-server.ts";

describe("MockApolloServer", () => {
  it("exposes the schema passed in the constructor", () => {
    const schema = { __test: "schema" };
    const server = new MockApolloServer({ schema });
    expect(server.schema).toBe(schema);
  });

  it("constructs without a schema argument", () => {
    const server = new MockApolloServer();
    expect(server).toBeInstanceOf(MockApolloServer);
    expect(server.schema).toBeUndefined();
  });
});
