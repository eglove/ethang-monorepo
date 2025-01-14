import { ChangeDetectionStrategy, Component } from "@angular/core";

import { BlogLayoutComponent } from "../../layouts/blog-layout/blog-layout.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent],
  selector: "app-angular-now",
  templateUrl: "./angular-now.component.html",
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AngularNowComponent {}
