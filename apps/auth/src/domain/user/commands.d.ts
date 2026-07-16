export type UserCommand =
  | {
      readonly email: string;
      readonly kind: "SignIn";
      readonly password: string;
    }
  | {
      readonly email: string;
      readonly kind: "SignUp";
      readonly password: string;
      readonly username?: string;
    }
  | {
      readonly email: string;
      readonly kind: "ValidateCredentials";
      readonly password: string;
    }
  | {
      readonly kind: "VerifyToken";
      readonly token: string;
    };
