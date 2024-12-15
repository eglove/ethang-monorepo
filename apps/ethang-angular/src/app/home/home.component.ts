import { ChangeDetectionStrategy, Component } from "@angular/core";

import {
  MainLayoutComponent,
} from "../layouts/main-layout/main-layout.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MainLayoutComponent,
  ],
  selector: "app-home",
  templateUrl: "./home.component.html",
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class HomeComponent {

}
