export type UserEvent =
  | {
      readonly email: string;
      readonly kind: "CredentialsValidated";
    }
  | {
      readonly email: string;
      readonly kind: "UserCreated";
      readonly lastLoggedIn: string;
      readonly password: string;
      readonly username: string;
    }
  | {
      readonly email: string;
      readonly kind: "UserSignedIn";
      readonly lastLoggedIn: string;
    }
  | {
      readonly kind: "TokenVerified";
      readonly token: string;
    };
