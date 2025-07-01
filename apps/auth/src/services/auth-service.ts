import type { Context } from "hono";

import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import type { User } from "../../generated/prisma/client.js";
import type { getPrismaClient } from "../get-prisma-client.js";

export type AuthContext = Context<AuthContextObject>;
export type AuthContextObject = { Bindings: CloudflareBindings };

export class AuthService {
  public static readonly TOKEN_AUTH_KEY = "token-auth" as const;

  public constructor(
    private readonly prisma: ReturnType<typeof getPrismaClient>,
    private readonly tokenSecret: string,
  ) {}

  public async createUser(email: string, password: string, username: string) {
    const hashedPassword = await this.hashPassword(password);

    if (isError(hashedPassword)) {
      return hashedPassword;
    }

    const user = await attemptAsync(async () => {
      return this.prisma.user.create({
        data: {
          email,
          lastLoggedIn: new Date().toISOString(),
          password: hashedPassword,
          username,
        },
      });
    });

    if (isError(user)) {
      return user;
    }

    const token = await this.generateToken(user);

    if (isError(token)) {
      return token;
    }

    return attemptAsync(async () => {
      return this.prisma.user.update({
        data: { sessionToken: token },
        where: { email: user.email },
      });
    });
  }

  public async signIn(email: string, password: string) {
    const user = await this.validateCredentials(email, password);

    if (isError(user)) {
      return user;
    }

    const updatedUser = await this.rehashPassword(user, password);

    if (isError(updatedUser)) {
      return updatedUser;
    }

    const token = await this.updateUserToken(updatedUser);

    if (isError(token)) {
      return token;
    }

    return updatedUser;
  }

  public async verifyToken(token: string) {
    const secretKey = new TextEncoder().encode(this.tokenSecret);

    return attemptAsync(async () => {
      return jwtVerify(token, secretKey);
    });
  }

  private async generateToken(user: Omit<User, "password">) {
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
    user: Omit<User, "password">,
    newPassword: string,
  ) {
    const hashedPassword = await this.hashPassword(newPassword);

    if (isError(hashedPassword)) {
      return hashedPassword;
    }

    return attemptAsync(async () => {
      return this.prisma.user.update({
        data: {
          lastLoggedIn: new Date().toISOString(),
          password: hashedPassword,
        },
        where: { email: user.email },
      });
    });
  }

  private async updateUserToken(user: Omit<User, "password">) {
    const token = await this.generateToken(user);

    if (isError(token)) {
      return token;
    }

    return attemptAsync(async () => {
      return this.prisma.user.update({
        data: { sessionToken: token },
        where: { email: user.email },
      });
    });
  }

  private async validateCredentials(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      select: {
        email: true,
        id: true,
        lastLoggedIn: true,
        password: true,
        role: true,
        sessionToken: true,
        updatedAt: true,
        username: true,
      },
      where: { email },
    });

    if (isNil(user)) {
      return new Error("Invalid Credentials");
    }

    const compared = await bcrypt.compare(password, user.password);

    if (!compared) {
      return new Error("Invalid Credentials");
    }

    return user;
  }
}
