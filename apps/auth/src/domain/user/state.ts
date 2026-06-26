export type UserState = {
  readonly email: string;
  readonly id: null | string;
  readonly lastLoggedIn: null | string;
  readonly password: null | string;
  readonly role: null | string;
  readonly sessionToken: null | string;
  readonly updatedAt: null | string;
  readonly username: string;
};

export const initialState: UserState = {
  email: "",
  id: null,
  lastLoggedIn: null,
  password: null,
  role: null,
  sessionToken: null,
  updatedAt: null,
  username: ""
};
