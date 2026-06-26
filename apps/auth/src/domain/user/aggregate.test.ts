import { auth } from "@ethang/intl/en/auth.ts";
import { describe, expect, it } from "vitest";

import type { UserCommand } from "./commands.ts";
import type { UserEvent } from "./events.ts";

import { apply, decide } from "./aggregate.ts";
import { initialState, type UserState } from "./state.ts";

const EXISTING_EMAIL = "existing@test.com";

describe("decide", () => {
  it("emits UserCreated with email as username when SignUp without username", () => {
    const command: UserCommand = {
      email: auth.EMAIL,
      kind: "SignUp",
      password: auth.HASHED_PASSWORD
    };
    const events = decide(command, initialState);
    expect(events).toStrictEqual<UserEvent[]>([
      {
        email: auth.EMAIL,
        kind: "UserCreated",
        lastLoggedIn: expect.any(String),
        password: auth.HASHED_PASSWORD,
        username: auth.EMAIL
      }
    ]);
  });

  it("emits UserCreated when SignUp with no existing user", () => {
    const command: UserCommand = {
      email: auth.EMAIL,
      kind: "SignUp",
      password: auth.HASHED_PASSWORD,
      username: auth.TEST_USERNAME
    };
    const events = decide(command, initialState);
    expect(events).toStrictEqual<UserEvent[]>([
      {
        email: auth.EMAIL,
        kind: "UserCreated",
        lastLoggedIn: expect.any(String),
        password: auth.HASHED_PASSWORD,
        username: auth.TEST_USERNAME
      }
    ]);
  });

  it("emits UserSignedIn when SignUp with existing user", () => {
    const command: UserCommand = {
      email: EXISTING_EMAIL,
      kind: "SignUp",
      password: auth.HASHED_PASSWORD,
      username: "existinguser"
    };
    const state: UserState = {
      ...initialState,
      email: EXISTING_EMAIL,
      password: "text-content",
      username: "existinguser"
    };
    const events = decide(command, state);
    expect(events).toStrictEqual<UserEvent[]>([
      {
        email: EXISTING_EMAIL,
        kind: "UserSignedIn",
        lastLoggedIn: expect.any(String)
      }
    ]);
  });

  it("emits UserSignedIn when SignIn", () => {
    const command: UserCommand = {
      email: auth.EMAIL,
      kind: "SignIn",
      password: auth.PASSWORD
    };
    const state: UserState = {
      ...initialState,
      email: auth.EMAIL,
      password: auth.HASHED_PASSWORD,
      username: auth.TEST_USERNAME
    };
    const events = decide(command, state);
    expect(events).toStrictEqual<UserEvent[]>([
      {
        email: auth.EMAIL,
        kind: "UserSignedIn",
        lastLoggedIn: expect.any(String)
      }
    ]);
  });

  it("emits CredentialsValidated when ValidateCredentials", () => {
    const command: UserCommand = {
      email: auth.EMAIL,
      kind: "ValidateCredentials",
      password: auth.PASSWORD
    };
    const state: UserState = {
      ...initialState,
      email: auth.EMAIL,
      password: auth.HASHED_PASSWORD,
      username: auth.TEST_USERNAME
    };
    const events = decide(command, state);
    expect(events).toStrictEqual<UserEvent[]>([
      {
        email: auth.EMAIL,
        kind: "CredentialsValidated"
      }
    ]);
  });

  it("emits TokenVerified when VerifyToken", () => {
    const command: UserCommand = {
      kind: "VerifyToken",
      token: auth.TEST_JWT_TOKEN
    };
    const events = decide(command, initialState);
    expect(events).toStrictEqual<UserEvent[]>([
      {
        kind: "TokenVerified",
        token: auth.TEST_JWT_TOKEN
      }
    ]);
  });
});

describe("apply", () => {
  it("applies UserCreated to produce user state", () => {
    const event: UserEvent = {
      email: auth.EMAIL,
      kind: "UserCreated",
      lastLoggedIn: "2024-01-01T00:00:00.000Z",
      password: auth.HASHED_PASSWORD,
      username: auth.TEST_USERNAME
    };
    const newState = apply(initialState, event);
    expect(newState).toStrictEqual<UserState>({
      email: auth.EMAIL,
      id: null,
      lastLoggedIn: "2024-01-01T00:00:00.000Z",
      password: auth.HASHED_PASSWORD,
      role: null,
      sessionToken: null,
      updatedAt: null,
      username: auth.TEST_USERNAME
    });
  });

  it("applies UserSignedIn to update lastLoggedIn", () => {
    const state: UserState = {
      ...initialState,
      email: auth.EMAIL,
      password: auth.HASHED_PASSWORD,
      username: auth.TEST_USERNAME
    };
    const event: UserEvent = {
      email: auth.EMAIL,
      kind: "UserSignedIn",
      lastLoggedIn: "2024-06-01T00:00:00.000Z"
    };
    const newState = apply(state, event);
    expect(newState).toStrictEqual<UserState>({
      ...state,
      lastLoggedIn: "2024-06-01T00:00:00.000Z"
    });
  });

  it("applies CredentialsValidated (no state change)", () => {
    const state: UserState = {
      ...initialState,
      email: auth.EMAIL,
      password: auth.HASHED_PASSWORD,
      username: auth.TEST_USERNAME
    };
    const event: UserEvent = {
      email: auth.EMAIL,
      kind: "CredentialsValidated"
    };
    const newState = apply(state, event);
    expect(newState).toStrictEqual(state);
  });

  it("applies TokenVerified (no state change)", () => {
    const event: UserEvent = {
      kind: "TokenVerified",
      token: auth.TEST_JWT_TOKEN
    };
    const newState = apply(initialState, event);
    expect(newState).toStrictEqual(initialState);
  });
});
