import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from "@angular/core";

import { AuthService } from "../../services/auth.service.ts";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  selector: "app-sign-up-in",
  styles: "",
  templateUrl: "./sign-up-in.component.html",
})
export class SignUpInComponent {
  public signInUpService = inject(AuthService);
}
