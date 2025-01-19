import { inject, Injectable } from "@angular/core";
import attempt from "lodash/attempt.js";
import isNil from "lodash/isNil.js";

import { AuthService } from "./auth.service.ts";

type WsData = {
  payload?: unknown;
  type: string;
};

@Injectable({
  providedIn: "root",
})
export class CommentsSocketService {
  public token: null | string;

  private readonly authService = inject(AuthService);

  private isOpen = false;

  private socket: null | WebSocket = null;

  public constructor() {
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    this.token = globalThis.localStorage.getItem("token");
    this.init();
  }

  public addComment(message: string) {
    if (isNil(this.socket) || !this.isOpen) {
      return;
    }

    this.socket.send(JSON.stringify({
      payload: {
        message,
        url: globalThis.location.href,
        username: this.authService.tokenData()?.username,
      },
      type: "create-comment",
    }));
  }

  public getMessages() {
    if (isNil(this.socket) || !this.isOpen) {
      return;
    }

    this.socket.send(JSON.stringify({
      payload: { url: globalThis.location.href },
      type: "get-comments",
    }));
  }

  public init() {
    if (isNil(this.token)) {
      return;
    }

    const url = new URL("wss://comments.ethang.dev/ws");
    url.searchParams.set("token", this.token);
    this.socket = new WebSocket(url);

    if (isNil(this.socket)) {
      return;
    }

    this.socket.addEventListener("open", () => {
      this.isOpen = true;
      this.getMessages();
    });

    this.socket.addEventListener("close", () => {
      this.isOpen = false;
    });

    this.socket.addEventListener("message", (event: MessageEvent<string>) => {
      const message = attempt<WsData>(JSON.parse, event.data);

      console.log(message);
    });
  }
}
