import { DateTime } from "effect";

import type { UserCommand } from "./commands.ts";
import type { UserEvent } from "./events.ts";
import type { UserState } from "./state.ts";

const getTimestamp = () => {
  return DateTime.formatIso(DateTime.unsafeNow());
};

export const decide = (
  command: UserCommand,
  state: UserState
): readonly UserEvent[] => {
  switch (command.kind) {
    case "SignIn": {
      return [
        {
          email: command.email,
          kind: "UserSignedIn" as const,
          lastLoggedIn: getTimestamp()
        }
      ];
    }
    case "SignUp": {
      if ("" === state.email) {
        return [
          {
            email: command.email,
            kind: "UserCreated" as const,
            lastLoggedIn: getTimestamp(),
            password: command.password,
            username: command.username ?? command.email
          }
        ];
      }
      return [
        {
          email: command.email,
          kind: "UserSignedIn" as const,
          lastLoggedIn: getTimestamp()
        }
      ];
    }
    case "ValidateCredentials": {
      return [
        {
          email: command.email,
          kind: "CredentialsValidated" as const
        }
      ];
    }
    case "VerifyToken": {
      return [
        {
          kind: "TokenVerified" as const,
          token: command.token
        }
      ];
    }
  }
};

export const apply = (state: UserState, event: UserEvent): UserState => {
  switch (event.kind) {
    case "CredentialsValidated": {
      return state;
    }
    case "TokenVerified": {
      return state;
    }
    case "UserCreated": {
      return {
        ...state,
        email: event.email,
        lastLoggedIn: event.lastLoggedIn,
        password: event.password,
        username: event.username
      };
    }
    case "UserSignedIn": {
      return {
        ...state,
        lastLoggedIn: event.lastLoggedIn
      };
    }
  }
};
