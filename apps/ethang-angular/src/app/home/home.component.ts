import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import {
  MainLayoutComponent,
} from "../layouts/main-layout/main-layout.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MainLayoutComponent,
    RouterLink,
  ],
  selector: "app-home",
  templateUrl: "./home.component.html",
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class HomeComponent {

}
