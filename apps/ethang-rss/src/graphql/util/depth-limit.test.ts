import { buildSchema, parse, validate } from "graphql";
import { describe, expect, it } from "vitest";

import { depthLimit } from "./depth-limit.ts";

const schema = buildSchema(`
  type Query {
    user: User
    simpleField: String
  }
  type User {
    id: ID!
    name: String
    friends: [User!]
  }
`);

describe("depthLimit", () => {
  it("should allow queries within the depth limit", () => {
    const query = parse(`
      query {
        user {
          name
        }
      }
    `);

    const errors = validate(schema, query, [depthLimit(2)]);
    expect(errors.length).toBe(0);
  });

  it("should report an error if the query exceeds the depth limit", () => {
    const query = parse(`
      query {
        user {
          friends {
            name
          }
        }
      }
    `);

    const errors = validate(schema, query, [depthLimit(1)]);
    expect(errors.length).toBe(1);
    expect(errors[0]?.message).toBe(
      "Query depth of 2 exceeds maximum depth of 1"
    );
  });

  it("should support fragment spreads", () => {
    const query = parse(`
      query {
        user {
          ...UserFields
        }
      }

      fragment UserFields on User {
        name
      }
    `);

    const errors = validate(schema, query, [depthLimit(2)]);
    expect(errors.length).toBe(0);
  });

  it("should report error if fragment spread exceeds limit", () => {
    const query = parse(`
      query {
        user {
          ...UserFields
        }
      }

      fragment UserFields on User {
        friends {
          friends {
            name
          }
        }
      }
    `);

    const errors = validate(schema, query, [depthLimit(2)]);
    expect(errors.length).toBe(1);
    expect(errors[0]?.message).toBe(
      "Query depth of 3 exceeds maximum depth of 2"
    );
  });

  it("should handle undefined fragment spreads gracefully", () => {
    const query = parse(`
      query {
        user {
          ...UndefinedFields
        }
      }
    `);

    // The validation rule itself should not crash, it will just not find the fragment and treat it at current depth
    const errors = validate(schema, query, [depthLimit(2)]);
    expect(errors.length).toBe(0);
  });

  it("should support inline fragments", () => {
    const query = parse(`
      query {
        user {
          ... on User {
            friends {
              friends {
                name
              }
            }
          }
        }
      }
    `);

    const errors = validate(schema, query, [depthLimit(2)]);
    expect(errors.length).toBe(1);
    expect(errors[0]?.message).toBe(
      "Query depth of 3 exceeds maximum depth of 2"
    );
  });

  it("should allow deep inline fragments under the limit", () => {
    const query = parse(`
      query {
        user {
          ... on User {
            name
          }
        }
      }
    `);

    const errors = validate(schema, query, [depthLimit(2)]);
    expect(errors.length).toBe(0);
  });
});
