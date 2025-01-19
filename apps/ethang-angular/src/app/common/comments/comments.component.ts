import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";

import { AuthService } from "../../services/auth.service.ts";
import { CommentsSocketService } from "../../services/comments-socket.service.ts";
import { SignUpInComponent } from "../sign-up-in/sign-up-in.component.ts";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SignUpInComponent,
  ],
  selector: "app-comments",
  styles: "",
  templateUrl: "./comments.component.html",
})
export class CommentsComponent {
  public authService = inject(AuthService);

  public readonly comment = signal("");

  public commentsSocket = inject(CommentsSocketService);

  public handleAddComment(event: Event) {
    event.preventDefault();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);

    const message = data.get("message");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    this.commentsSocket.addComment(message as string);
  }
}
