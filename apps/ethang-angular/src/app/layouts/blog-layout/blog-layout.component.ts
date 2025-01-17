import { ChangeDetectionStrategy, Component } from "@angular/core";

import { MainLayoutComponent } from "../main-layout/main-layout.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainLayoutComponent],
  selector: "app-blog-layout",
  templateUrl: "./blog-layout.component.html",
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class BlogLayoutComponent {}
