import type { Context } from "hono";

import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { setCookieValue } from "@ethang/toolbelt/http/cookie.js";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { jwtVerify, SignJWT } from "jose";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import type { getDatabase } from "../get-database.js";

import { user as userTable } from "../db/schema.js";

export type AuthContext = Context<AuthContextObject>;
export type AuthContextObject = { Bindings: CloudflareBindings };

export class AuthService {
  public static readonly AUTH_COOKIE_NAME = "ethang-auth-token" as const;
  public static readonly TOKEN_SECRET_KEY = "token-auth" as const;

  public constructor(
    private readonly database: ReturnType<typeof getDatabase>,
    private readonly tokenSecret: string,
  ) {}

  public async createUser(email: string, password: string, username: string) {
    const hashedPassword = await this.hashPassword(password);

    if (isError(hashedPassword)) {
      return hashedPassword;
    }

    const user = await attemptAsync(async () => {
      const [newUser] = await this.database
        .insert(userTable)
        .values({
          email,
          lastLoggedIn: new Date().toISOString(),
          password: hashedPassword,
          username,
        })
        .returning();

      return newUser;
    });

    if (isError(user) || isNil(user)) {
      return user;
    }

    return this.updateUserToken(user);
  }

  public setAuthCookie(response: Response, token: string) {
    setCookieValue({
      config: {
        HttpOnly: false,
        "Max-Age": 31_536_000, // 1 year in seconds
        Path: "/",
        SameSite: "None",
        Secure: true,
      },
      cookieName: AuthService.AUTH_COOKIE_NAME,
      cookieValue: token,
      response,
    });
  }

  public async signIn(email: string, password: string) {
    const user = await this.validateCredentials(email, password);

    if (isError(user)) {
      return user;
    }

    const updatedUser = await this.rehashPassword(user, password);

    if (isError(updatedUser) || isNil(updatedUser)) {
      return updatedUser;
    }

    const token = await this.updateUserToken(updatedUser);

    if (isError(token)) {
      return token;
    }

    return updatedUser;
  }

  public async signUp(email: string, password: string, username?: string) {
    const userResult = await this.database.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (isNil(userResult)) {
      return this.createUser(email, password, username ?? email);
    }

    return this.signIn(email, password);
  }

  public async verifyToken(token: string) {
    const secretKey = new TextEncoder().encode(this.tokenSecret);

    return attemptAsync(async () => {
      return jwtVerify(token, secretKey);
    });
  }

  private async generateToken(user: typeof userTable.$inferSelect) {
    const secretKey = new TextEncoder().encode(this.tokenSecret);

    return attemptAsync(async () => {
      return new SignJWT({
        email: user.email,
        role: user.role,
        sub: user.id,
        username: user.username,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1yr")
        .sign(secretKey);
    });
  }

  private async hashPassword(password: string) {
    return attemptAsync(async () => {
      const salt = await bcrypt.genSalt();
      return bcrypt.hash(password, salt);
    });
  }

  private async rehashPassword(
    user: typeof userTable.$inferSelect,
    newPassword: string,
  ) {
    const hashedPassword = await this.hashPassword(newPassword);

    if (isError(hashedPassword)) {
      return hashedPassword;
    }

    return attemptAsync(async () => {
      const [updatedUser] = await this.database
        .update(userTable)
        .set({
          lastLoggedIn: new Date().toISOString(),
          password: hashedPassword,
        })
        .where(eq(userTable.email, user.email))
        .returning();

      return updatedUser;
    });
  }

  private async updateUserToken(user: typeof userTable.$inferSelect) {
    const token = await this.generateToken(user);

    if (isError(token)) {
      return token;
    }

    return attemptAsync(async () => {
      const [updatedUser] = await this.database
        .update(userTable)
        .set({ sessionToken: token })
        .where(eq(userTable.email, user.email))
        .returning();

      return updatedUser;
    });
  }

  private async validateCredentials(email: string, password: string) {
    const userResult = await this.database.query.userTable.findFirst({
      where: eq(userTable.email, email),
    });

    if (isNil(userResult)) {
      return new Error("Invalid Credentials");
    }

    const compared = await bcrypt.compare(password, userResult.password);

    if (!compared) {
      return new Error("Invalid Credentials");
    }

    return userResult;
  }
}
